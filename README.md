# Introduction

The goal of this repository is to provide methods to extract information from an html document, namely an email train booking summary.

# Installation

```yarn install``` after cloning the repository.

# Running the test

```yarn jest```

As of today version, the test fails because the age categories in the `test-result.json` file are not consistent with the `test.html` file. I kept the information that was in the email, and also added the passengers information for all trips.

You can visualize results after the test has been run:
- Open `formatted-test.html` in your browser to see a preview of the email
- Open `parsed-test.json` to see obtained result