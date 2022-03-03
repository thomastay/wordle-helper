package main

import (
	"bufio"
	"bytes"
	"compress/gzip"
	"fmt"
	"os"
	"strings"
)

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func main() {
	subCommand := os.Args[1]
	if subCommand == "template" {
		Template()
	} else if subCommand == "calcBundleSize" {
		CalcBundleSize()
	} else {
		panic(fmt.Sprintf("Did not recognize subCommand %s", subCommand))
	}
}

// Templating (the main behavior)

func Template() {
	templateFilename := os.Args[2]
	jsFilename := os.Args[3]
	cssFilename := os.Args[4]
	suggestionHTMLFilename := os.Args[5]
	afterSuggestionsFilename := os.Args[6]
	outFilename := os.Args[7]

	replaceMap := make(map[string][]byte, 2)
	minifiedJS, err := os.ReadFile(jsFilename)
	check(err)
	replaceMap["<% JS %>"] = bytes.TrimSpace(minifiedJS)

	minifiedCSS, err := os.ReadFile(cssFilename)
	check(err)
	replaceMap["<% CSS %>"] = bytes.TrimSpace(minifiedCSS)

	suggestionHTML, err := os.ReadFile(suggestionHTMLFilename)
	check(err)
	replaceMap["<% SUGGESTIONS %>"] = bytes.TrimSpace(suggestionHTML)

	afterSuggestions, err := os.ReadFile(afterSuggestionsFilename)
	check(err)
	replaceMap["<% AFTER_SUGGESTIONS %>"] = bytes.TrimSpace(afterSuggestions)

	templateFile, err := os.Open(templateFilename)
	check(err)
	defer templateFile.Close()

	outFile, err := os.Create(outFilename)
	check(err)
	defer outFile.Close()
	outWriter := bufio.NewWriter(outFile)
	defer outWriter.Flush()

	scanner := bufio.NewScanner(templateFile)
	for scanner.Scan() {
		currLine := scanner.Text()
		currLine = strings.TrimSpace(currLine)
		if strings.HasPrefix(currLine, "<%") {
			if replace, ok := replaceMap[currLine]; ok {
				outWriter.Write(replace)
				continue
			} //fallthrough
		} else if strings.HasPrefix(currLine, "<!--") {
			// This is a line comment
			continue
		}
		outWriter.WriteString(currLine)
		outWriter.WriteString("\n")
	}
	if err := scanner.Err(); err != nil {
		panic(err)
	}
}

// calculating bundle sizes
func CalcBundleSize() {
	// args
	htmlFilename := os.Args[2]
	outFilename := os.Args[3]

	parsedData, err := os.ReadFile(htmlFilename)
	check(err)

	outFile, err := os.Create(outFilename)
	check(err)
	defer outFile.Close()
	outWriter := bufio.NewWriter(outFile)
	defer outWriter.Flush()

	parsedSize := len(parsedData)

	var buf bytes.Buffer
	zw := gzip.NewWriter(&buf)

	_, err = zw.Write(parsedData)
	check(err)

	err = zw.Flush()
	check(err)

	gzippedSize := buf.Len()
	// shitty version of json writer
	toWrite := fmt.Sprintf(`{ "minified": %d, "parsed": %d }`, gzippedSize, parsedSize)
	outWriter.WriteString(toWrite)
}
