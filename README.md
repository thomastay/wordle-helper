# [Visit the website at this link](https://ttay.me/wordle-helper/)

# Summary
Helps you play wordle.

# Building
You need Node, [pnpm](https://pnpm.io), [Go](https://go.dev) and [Ninja](https://ninja-build.org) to build the wordle helper.

```
pnpm i
pnpm build
```
You are recommended to use pnpm, but you can use npm as well.

# Developing
I use ninja for development and watchexec for watching files. Ninja helps to track built dependencies so we don't have to do full rebuilds all the time

# Results of the Wordle Helper (best words to start with)
```
Greater than 2
[
  [ 'crate', 1899 ],
  [ 'trace', 1899 ],
  [ 'slate', 1903 ],
  [ 'parse', 1906 ],
  [ 'heart', 1907 ]
]
Greater than 3
[
  [ 'crane', 1081 ],
  [ 'crate', 1092 ],
  [ 'train', 1094 ],
  [ 'slate', 1102 ],
  [ 'trace', 1105 ]
]
Greater than 4
[
  [ 'clasp', 294 ],
  [ 'crane', 295 ],
  [ 'slant', 297 ],
  [ 'plant', 299 ],
  [ 'scalp', 301 ]
]
Greater than 5
[
  [ 'clasp', 43 ],
  [ 'scalp', 46 ],
  [ 'split', 47 ],
  [ 'crisp', 48 ],
  [ 'prawn', 48 ]
]
Greater than 6
[
  [ 'spunk', 3 ],
  [ 'stamp', 4 ],
  [ 'stomp', 4 ],
  [ 'psalm', 5 ],
  [ 'shank', 5 ]
]

```
