# First arg is the js filename, second is input template html, third is output
import subprocess, sys
def replace_line(file_name, line_num, text, out_file_name):
    lines = open(file_name, 'r').readlines()
    lines[line_num-1] = text
    out = open(out_file_name, 'w')
    out.writelines(lines)
    out.close()
p = subprocess.run(["esbuild", "--minify", sys.argv[1]],
        capture_output = True, shell=True)
minified = p.stdout.decode("utf-8")
print(minified)
replace_line(sys.argv[2], 54, minified, sys.argv[3])
