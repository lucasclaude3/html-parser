# Introduction

The goal of this repository is to provide methods to extract information from an html document, namely an email train booking summary.

# Installation

```yarn install``` after cloning the repository.

# Running the test

```yarn jest```

Note: the original `test-result-old.json` file was not consistent with the `test.html` file for the passengers age. I modified it into `test-result.json`. The diff is the following:

```
diff --git a/test-result.json b/test-result-old.json
old mode 100755
new mode 100644
index 072748a..6d4065f
--- a/test-result.json
+++ b/test-result-old.json
@@ -72,11 +72,11 @@
                     },
                     {
                       "type": "échangeable",
-                      "age": "(26 à 59 ans)"
+                      "age": "(4 à 11 ans)"
                     },
                     {
                       "type": "échangeable",
-                      "age": "(26 à 59 ans)"
+                      "age": "(0 à 3 ans)"
                     }
                   ]
                 }
```

You can visualize results after the test has been run:
- Open `formatted-test.html` in your browser to see a preview of the email
- Open `parsed-test.json` to see obtained result