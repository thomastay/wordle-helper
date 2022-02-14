#!/usr/bin/env/python3
# First arg is the template filename, second and third are js and css filenames,
# last is the output filename

import subprocess, sys
def replace_line(file_name, replace, out_filename):
    lines = open(file_name, 'r').readlines()
    for i, line in enumerate(lines):
        if line.startswith("<%"):
            text = replace.get(line.strip())
            if text:
                lines[i] = text
    out = open(out_filename, 'w')
    out.writelines(lines)
    out.close()

template_filename = sys.argv[1]
js_filename = sys.argv[2]
css_filename = sys.argv[3]
out_filename = sys.argv[4]

replace = {}
replace["<% JS %>"] = open(js_filename, 'r').read()
replace["<% CSS %>"] = open(css_filename, 'r').read()
replace_line(template_filename, replace, out_filename)
