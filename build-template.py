#!/usr/bin/env/python3
# First arg is the js filename, second is css filename, third is input template html, last is output
import subprocess, sys
def replace_line(file_name, line_num, replace, out_file_name):
    lines = open(file_name, 'r').readlines()
    for i, line in enumerate(lines):
        if line.startswith("<%"):
            text = replace.get(line.strip())
            if text:
                lines[i] = text
    out = open(out_file_name, 'w')
    out.writelines(lines)
    out.close()

replace = {}
p = subprocess.run(["node", "./node_modules/esbuild/bin/esbuild", "--minify", sys.argv[1]],
        capture_output = True)
js_minified = p.stdout.decode("utf-8")
replace["<% JS %>"] = js_minified
p = subprocess.run(["node", "./node_modules/esbuild/bin/esbuild", "--minify", sys.argv[2]],
        capture_output = True)
css_minified = p.stdout.decode("utf-8")
replace["<% CSS %>"] = css_minified

replace_line(sys.argv[3], 54, replace, sys.argv[4])
