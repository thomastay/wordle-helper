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
		template()
	} else {
		panic(fmt.Sprintf("Did not recognize subCommand %s", subCommand))
	}
}

// Templating (the main behavior)

func template() {
	// inputs ($in)
	templateFilename := os.Args[2]
	jsFilename := os.Args[3]
	cssFilename := os.Args[4]
	suggestionHTMLFilename := os.Args[5]
	afterSuggestionsFilename := os.Args[6]
	// output ($out)
	outFilename := os.Args[7]
	bundleSizeOutFilename := os.Args[8]

	// ---- initialize arguments and parse files ----

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

	// --- Create output files (the index.html output, and the bundle size out)
	outFile, err := os.Create(outFilename)
	check(err)
	defer outFile.Close()
	outWriter := bufio.NewWriter(outFile)
	defer outWriter.Flush()
	bundleSizeOutFile, err := os.Create(bundleSizeOutFilename)
	check(err)
	defer bundleSizeOutFile.Close()
	bundleSizeOutWriter := bufio.NewWriter(bundleSizeOutFile)
	defer bundleSizeOutWriter.Flush()

	// code to calculate bundle size
	parsedSize := 0
	var gzipBuf bytes.Buffer
	zw := gzip.NewWriter(&gzipBuf)

	writeBoth := func(b []byte) {
		parsedSize += len(b)
		outWriter.Write(b)
		_, err = zw.Write(b)
		check(err)
	}

	scanner := bufio.NewScanner(templateFile)
	for scanner.Scan() {
		currLine := scanner.Text()
		currLine = strings.TrimSpace(currLine)
		if strings.HasPrefix(currLine, "<%") {
			if replace, ok := replaceMap[currLine]; ok {
				writeBoth(replace)
				continue
			} //fallthrough
		} else if strings.HasPrefix(currLine, "<!--") {
			// This is a line comment
			continue
		}
		writeBoth([]byte(currLine))
		writeBoth([]byte("\n"))
	}
	err = scanner.Err()
	check(err)

	// Write to bundle-size.json
	err = zw.Flush()
	check(err)

	gzippedSize := gzipBuf.Len()
	// shitty version of json writer
	toWrite := fmt.Sprintf(`{ "minified": %d, "parsed": %d }`, gzippedSize, parsedSize)
	bundleSizeOutWriter.WriteString(toWrite)
	bundleSizeOutWriter.WriteByte('\n')
}
