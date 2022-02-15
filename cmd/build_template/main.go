package main

import (
	"bufio"
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
	outFilename := os.Args[4]

	replaceMap := make(map[string][]byte, 2)
	minifiedJS, err := os.ReadFile(jsFilename)
	check(err)
	replaceMap["<% JS %>"] = minifiedJS

	minifiedCSS, err := os.ReadFile(cssFilename)
	check(err)
	replaceMap["<% CSS %>"] = minifiedCSS

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
		if strings.HasPrefix(currLine, "<%") {
			if replace, ok := replaceMap[currLine]; ok {
				outWriter.Write(replace)
				continue
			} //fallthrough
		}
		outWriter.WriteString(currLine)
		outWriter.WriteString("\n") // stripped from scanner
	}
}
