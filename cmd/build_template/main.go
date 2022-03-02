package main

import (
	"bufio"
	"bytes"
	"log"
	"os"
	"strings"
)

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func main() {
	templateFilename := os.Args[1]
	jsFilename := os.Args[2]
	cssFilename := os.Args[3]
	suggestionHTMLFilename := os.Args[4]
	afterSuggestionsFilename := os.Args[5]
	outFilename := os.Args[6]

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
		// These are valid starting lines that my ad hoc templater can handle
		if !strings.HasPrefix(currLine, "<") && !strings.HasPrefix(currLine, "/>") {
			log.Printf("Warning: this templater is very dumb at stripping newlines and may have issues with this line. Adding a newline to be safe.\n Offending line: %s\n", currLine)
			outWriter.WriteString("\n")
		}
		outWriter.WriteString(currLine)
	}
	if err := scanner.Err(); err != nil {
		panic(err)
	}
}
