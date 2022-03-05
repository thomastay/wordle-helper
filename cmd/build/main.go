package main

// This build tools panics on any error, which is ok for a build tool but
// probably not good for your production code.

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

/// Templating (the main behavior)
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

	templateData := make(map[string][]byte, 4)
	addTemplateKey(templateData, jsFilename, "JS")
	addTemplateKey(templateData, cssFilename, "CSS")
	addTemplateKey(templateData, suggestionHTMLFilename, "SUGGESTIONS")
	addTemplateKey(templateData, afterSuggestionsFilename, "AFTER_SUGGESTIONS")

	// --- Create output files and Writers (the index.html output, and the bundle size out)
	var outWriter, bundleSizeOutWriter *bufio.Writer
	{
		// Reminder: these defers are in function scope
		outFile, err := os.Create(outFilename)
		check(err)
		defer outFile.Close()
		outWriter = bufio.NewWriter(outFile)
		defer outWriter.Flush()

		bundleSizeOutFile, err := os.Create(bundleSizeOutFilename)
		check(err)
		defer bundleSizeOutFile.Close()
		bundleSizeOutWriter = bufio.NewWriter(bundleSizeOutFile)
		defer bundleSizeOutWriter.Flush()
	}

	// code to calculate bundle size
	parsedSize := 0
	var gzipBuf bytes.Buffer
	zw := gzip.NewWriter(&gzipBuf)
	writeBoth := func(b []byte) {
		parsedSize += len(b)
		outWriter.Write(b)
		_, err := zw.Write(b)
		check(err)
	}

	// Scan the template file line by line
	templateFile, err := os.Open(templateFilename)
	check(err)
	defer templateFile.Close()
	scanner := bufio.NewScanner(templateFile)
	for scanner.Scan() {
		l := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(l, "<%") {
			if replace, ok := templateData[l]; ok {
				writeBoth(replace)
				continue
			} //fallthrough
		} else if strings.HasPrefix(l, "<!--") {
			// This is a HTML line comment
			continue
		}
		writeBoth([]byte(l))
		writeBoth([]byte("\n"))
	}
	err = scanner.Err()
	check(err)

	// Write to bundle-size.json
	err = zw.Flush()
	check(err)

	gzippedSize := gzipBuf.Len()
	// shitty version of json writer
	// https://www.npmjs.com/package/webpack-bundle-analyzer#size-definitions
	// for an explanation of what these mean
	bundleSizeOutWriter.WriteString(
		fmt.Sprintf(
			`{ "gzip": %d, "parsed": %d }`,
			gzippedSize, parsedSize,
		),
	)
	bundleSizeOutWriter.WriteByte('\n')
}

/// Given a key k, reads the bytes in filename from disk,
/// and puts <% k %> as the key to the file data in the map.
func addTemplateKey(m map[string][]byte, filename, k string) {
	b, err := os.ReadFile(filename)
	check(err)
	// Note that the double % is to escape a single %
	k = fmt.Sprintf("<%% %s %%>", k)
	m[k] = bytes.TrimSpace(b)
}
