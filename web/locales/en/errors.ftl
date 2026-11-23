### The errors of the programs, in English (see interface.ftl for the rule of the names): those
### of the checks before running (see Checks before running in specs.md), then those that stop
### a program while it runs (see Error handling). Each has two sentences: `-title`, what
### happened in this program, written in extra-bold, then `-rule`, the rule, true of every
### program (see An error in docs/design-system.md). The rule never becomes an order nor a
### guess: no fix, no "Did you mean". The words and the signs of other languages are the one
### exception: their rule shows the way of Stepwise.
###
### The family `error-<subject>-<part>` (`errorMessage`): the subject is the code of the error,
### or `foreign-word-<word>` for a word of another language (src/lib/errors/error-text.ts and
### runtime-error-text.ts); no code is both an error of the checks and one while running. No
### other message starts with `error-`. Every message may write `$line`, the line of the error;
### the other values are those of its code.
###
### A type of value is given by its name (`number`, `text`, `boolean`, `color`), which each
### message writes in its words: the variants list the types that the error can find.
###
### Shown in the font of the code, under the pointer in the editor and in the console: code is
### written as it is typed, without quotes, and a sign alone between straight quotes (':').

## The characters of the code.

error-tab-title = This line holds a tab.
error-tab-rule = Outside a text or a comment, code uses spaces, never tabs.

# $found (Number): the spaces of the line. $below, $above (Number): the two closest levels that
# it could take, the level of a line around it or four spaces more than the line above.
error-wrong-indent-title = This line is indented by { $found ->
        [one] 1 space
       *[other] { $found } spaces
    }, not { $below } or { $above }.
error-wrong-indent-rule = A block is indented by exactly four more spaces than the line that opens it.

error-unclosed-text-title = This text has no closing quote on its line.
error-unclosed-text-rule = A text starts and ends with '"' on the same line.

# $escape (String): the character after the backslash.
error-unknown-escape-title = \{ $escape } means nothing in a text.
error-unknown-escape-rule = In a text, \" writes a quote, \\ a backslash and \n a new line.

error-single-quote-title = This line holds a single quote.
error-single-quote-rule = A text is written between double quotes: "Hello".

# $limit (String): the largest number, as its digits.
error-number-too-large-title = This number is too large.
error-number-too-large-rule = A number is written up to { $limit }.

# $word (String): the word, as it is written.
error-name-starts-with-digit-title = { $word } starts with a digit.
error-name-starts-with-digit-rule = A name starts with a letter.

# $symbol (String): the sign, as it is written (`&&`). $keyword (String): the keyword of Stepwise
# that has its meaning (`and`).
error-symbol-for-keyword-title = { $symbol } isn’t a sign of Stepwise.
error-symbol-for-keyword-rule = Stepwise writes { $keyword } instead of { $symbol }.

# $character (String): the character, which may be a blank one, such as a non-breaking space.
error-unexpected-character-title = The character '{ $character }' has no meaning here.
error-unexpected-character-rule = Outside a text or a comment, code uses letters, digits, spaces and the signs of the language.

## The order of the words.

error-expected-value-title = A value is missing here.
error-expected-value-rule = A value is expected after an operator, a ',' or a '=', and after if, while and repeat.

error-trailing-comma-title = A ',' comes after the last value.
error-trailing-comma-rule = A ',' separates two values, or two parameters, and never ends their list.

error-not-after-operator-title = not comes right after an operator.
error-not-after-operator-rule = not is written at the start of a value, after and or or, or inside parentheses.

error-unexpected-token-title = This doesn’t fit after what comes before it.
error-unexpected-token-rule = A line holds one statement, and a ',' separates two values.

error-unclosed-paren-title = This '(' isn’t closed.
error-unclosed-paren-rule = Each '(' is closed by a ')' on the same line.

error-unmatched-paren-title = This ')' closes no '('.
error-unmatched-paren-rule = Each ')' closes a '(' opened before it on the line.

error-assign-in-expression-title = This '=' is inside a value.
error-assign-in-expression-rule = '=' gives a value to a variable, and '==' compares two values.

error-chained-comparison-title = This comparison follows another one.
error-chained-comparison-rule = Comparisons don’t chain: two of them are joined with and.

error-foreign-word-elif-title = elif isn’t a word of Stepwise.
error-foreign-word-elif-rule = Stepwise writes else if.
error-foreign-word-def-title = def isn’t a word of Stepwise.
error-foreign-word-def-rule = Stepwise defines a function with function.
error-foreign-word-var-title = var isn’t a word of Stepwise.
error-foreign-word-var-rule = Stepwise declares a variable with let.
error-foreign-word-const-title = const isn’t a word of Stepwise.
error-foreign-word-const-rule = Stepwise declares a variable with let.
error-foreign-word-for-title = for isn’t a word of Stepwise.
error-foreign-word-for-rule = Stepwise loops with repeat and while.
error-foreign-word-continue-title = continue isn’t a word of Stepwise.
error-foreign-word-continue-rule = A loop of Stepwise runs its whole block each time, or leaves it with break.
error-foreign-word-pass-title = pass isn’t a word of Stepwise.
error-foreign-word-pass-rule = A block of Stepwise holds at least one line of code.
error-foreign-word-none-title = none isn’t a word of Stepwise.
error-foreign-word-none-rule = A value of Stepwise is a number, a text, a boolean or a color, never nothing.
error-foreign-word-null-title = null isn’t a word of Stepwise.
error-foreign-word-null-rule = A value of Stepwise is a number, a text, a boolean or a color, never nothing.

error-expected-name-title = A name is missing after let.
error-expected-name-rule = let is followed by the name of the variable, then '=' and its first value.

# $keyword (String): the keyword.
error-keyword-as-name-title = { $keyword } is a keyword of Stepwise.
error-keyword-as-name-rule = The keywords are reserved: a variable, a function or a parameter can’t take their names.

error-expected-equal-title = The '=' after the name is missing.
error-expected-equal-rule = A variable is declared with its first value: let, its name, '=' and the value.

error-unexpected-indent-title = This line is indented, but no block opens above it.
error-unexpected-indent-rule = Only the lines under a line ending with ':' are indented further.

error-expected-colon-title = Expected ':' at the end of the line.
error-expected-colon-rule = A line that opens a block, with if, else, while, repeat or function, ends with ':'.

error-after-colon-title = Something follows the ':' on its line.
error-after-colon-rule = The block of a ':' goes on the lines under it, indented by four more spaces.

error-empty-block-title = No line is indented under this line.
error-empty-block-rule = A line ending with ':' opens a block of at least one line, indented by four more spaces.

error-comment-only-block-title = This block holds only comments.
error-comment-only-block-rule = A block holds at least one line of code: the comments don’t count.

error-else-without-if-title = This else follows no if.
error-else-without-if-rule = An else comes right after the block of an if or of an else if, at the indentation of its if.

error-else-after-else-title = This if already has its else above.
error-else-after-else-rule = The else of an if comes last, once.

error-expected-function-name-title = A name is missing after function.
error-expected-function-name-rule = function is followed by the name of the function, then its parentheses.

error-expected-parentheses-title = The parentheses after the name are missing.
error-expected-parentheses-rule = A function is defined with its parentheses, even when it has no parameter.

error-invalid-parameter-title = This can’t be a parameter.
error-invalid-parameter-rule = The parameters of a function are names separated by ','.

# $limit (Number): the deepest level.
error-expression-too-deep-title = This expression is nested too deep.
error-expression-too-deep-rule = An expression nests up to { $limit } levels, the blocks around it included.

# $limit (Number): the deepest level.
error-blocks-too-deep-title = This block is nested too deep.
error-blocks-too-deep-rule = Blocks nest up to { $limit } deep.

## The names and the structure.

error-break-outside-loop-title = This break is in no loop.
error-break-outside-loop-rule = break leaves the while or the repeat around it, in the same function.

error-return-outside-function-title = This return is in no function.
error-return-outside-function-rule = return leaves a function, and is written inside one.

error-nested-function-title = This function is defined inside a block.
error-nested-function-rule = Functions are defined at the top level of the program, never in a block or in another function.

# $name (String): the name, as it is written.
error-not-snake-case-title = { $name } isn’t in snake_case.
error-not-snake-case-rule = Names use lowercase letters from a to z, digits and underscores, and start with a letter.

# $word (String): the reserved word. $belongsTo (String): what it is, `function` or `color`.
error-reserved-name-title = { $word } is { $belongsTo ->
        [color] a color
       *[function] a built-in function
    } of Stepwise.
error-reserved-name-rule = The names of the built-in functions and of the colors are reserved: a variable, a function or a parameter can’t take them.

# $name (String): the name of the parameter.
error-duplicate-parameter-title = The function already has a parameter named { $name }.
error-duplicate-parameter-rule = Two parameters of a function can’t have the same name.

# $name (String): the name read.
error-unknown-name-title = The name { $name } doesn’t exist.
error-unknown-name-rule = A variable is declared with let before it is used.

# $name (String): the name changed.
error-undeclared-variable-changed-title = { $name } is changed, but no variable has this name.
error-undeclared-variable-changed-rule = A variable is declared with let, then '=' alone changes its value.

# $name (String): the variable. $declared (Number): the line of its `let`.
error-variable-before-let-title = { $name } is used before its let, on line { $declared }.
error-variable-before-let-rule = A variable exists from its let to the end of its block.

# $name (String): the variable. $declared (Number): the line of its `let`.
error-variable-after-block-title = { $name } is used after the end of its block, which declares it on line { $declared }.
error-variable-after-block-rule = A variable exists from its let to the end of its block.

# $name (String): the variable.
error-main-variable-in-function-title = { $name } is a variable of the main program, used in a function.
error-main-variable-in-function-rule = A function sees only its parameters and its own variables.

# $name (String): the variable. $first (Number): the line where it was declared first.
error-already-declared-title = { $name } is already declared, on line { $first }.
error-already-declared-rule = let declares a variable once, then '=' alone changes its value.

# $name (String): the function. $first (Number): the line of the first definition.
error-duplicate-function-title = A function named { $name } is already defined, on line { $first }.
error-duplicate-function-rule = A name is one thing in the whole program: two functions can’t share it.

# $name (String): the function. $defined (Number): the line of its definition.
error-name-of-function-title = { $name } is the name of a function, defined on line { $defined }.
error-name-of-function-rule = A variable or a parameter can’t take the name of a function of the program.

# $name (String): the function. $line (Number): the line of the call. $defined (Number): the line
# of its definition.
error-called-before-definition-title = { $name } is called on line { $line } but defined on line { $defined }.
error-called-before-definition-rule = A function is defined above the lines that call it.

# $name (String): the function. $expected (Number): its parameters. $given (Number): the values
# of the call.
error-wrong-value-count-title = { $name } takes { $expected ->
        [0] no value
        [one] 1 value
       *[other] { $expected } values
    }, not { $given }.
error-wrong-value-count-rule = A call gives one value for each parameter of the function.

# $name (String): the function.
error-function-without-parentheses-title = { $name } is a function, named without its parentheses.
error-function-without-parentheses-rule = A function is always written with its parentheses.

# $name (String): the variable.
error-variable-called-title = { $name } is a variable, called like a function.
error-variable-called-rule = Only a function is called: a variable is written without parentheses.

# $name (String): the name called.
error-unknown-function-title = No function is named { $name }.
error-unknown-function-rule = A call needs a function, built in or defined above it.

error-expression-alone-title = This line holds a value alone, which does nothing.
error-expression-alone-rule = Of the values, only a call can stand alone on its line.

## The errors while the program runs: only the values decide them, so the checks before running
## can't find them.

# $found (String): the type of the condition.
error-condition-not-boolean-title = This condition is { $found ->
        [number] a number
        [text] a text
       *[color] a color
    }, not a boolean.
error-condition-not-boolean-rule = The condition of an if, an else if or a while is a boolean: true or false.

# $found (String): the type of the count.
error-repeat-count-not-number-title = The count of this repeat is { $found ->
        [text] a text
        [boolean] a boolean
       *[color] a color
    }, not a number.
error-repeat-count-not-number-rule = The count of a repeat is a whole number, 0 or more.

# $count (String): the count, as its digits.
error-negative-repeat-count-title = The count of this repeat is { $count }, below 0.
error-negative-repeat-count-rule = The count of a repeat is a whole number, 0 or more.

# $operator (String): the operator, `-` or `not`. $group (String): `negate` for `-`, `not` for
# `not`. $found (String): the type of the value after it.
error-unary-operand-title = { $group ->
        [not] not stands in front of { $found ->
            [number] a number
            [text] a text
           *[color] a color
        }.
       *[negate] '-' stands in front of { $found ->
            [text] a text
            [boolean] a boolean
           *[color] a color
        }.
    }
error-unary-operand-rule = { $group ->
        [not] not takes a boolean: true or false.
       *[negate] '-' in front of a value takes a number.
    }

# $operator (String): the sign between the two values. $group (String): what the operator does,
# `plus` for '+', `arithmetic` for '-', '*', '/' and '%', `order` for '<', '<=', '>' and '>=',
# `equality` for '==' and '!=', `logic` for and and or, which a side that isn't a boolean stops
# with an error of its own. $left, $right (String): the types of the two values.
error-binary-operands-title = '{ $operator }' has { $left ->
        [number] a number
        [text] a text
        [boolean] a boolean
       *[color] a color
    } on its left and { $right ->
        [number] a number
        [text] a text
        [boolean] a boolean
       *[color] a color
    } on its right.
error-binary-operands-rule = { $group ->
        [plus] '+' adds two numbers or joins two texts.
        [order] '{ $operator }' compares two numbers.
        [equality] '{ $operator }' compares two values of the same type.
        [logic] { $operator } joins two booleans: true or false.
       *[arithmetic] '{ $operator }' takes a number on each side.
    }

# $operator (String): `and` or `or`. $found (String): the type of the side that stopped it.
error-logic-operand-title = This side of { $operator } is { $found ->
        [number] a number
        [text] a text
       *[color] a color
    }, not a boolean.
error-logic-operand-rule = { $operator } joins two booleans: true or false.

error-division-by-zero-title = The program divided by zero.
error-division-by-zero-rule = '/' and '%' need a number other than 0 on their right.

# $smallest, $largest (String): the smallest and the largest whole numbers, as their digits.
error-overflow-title = This result is beyond what a number holds.
error-overflow-rule = A number stays between { $smallest } and { $largest }.

# $limit (Number): the most characters of a text.
error-text-too-long-title = This text would be longer than { $limit } characters.
error-text-too-long-rule = Two texts joined with '+' make { $limit } characters at most.

# $function (String): the function, as it is written: built in or of the program.
error-no-value-title = { $function } gives no value back.
error-no-value-rule = A call is used as a value only when its function gives one back.

# $limit (Number): the most calls in progress, one inside the other. The function called isn't
# named: it may not be the one that calls itself (`count` calls `show`, then itself).
error-too-many-calls-title = { $limit } calls in progress: the limit is reached.
error-too-many-calls-rule = A function that calls itself needs a case where it doesn’t.

error-bump-title = The robot bumped into a wall.
error-bump-rule = forward() needs a free cell in front of the robot.

error-already-carrying-title = The robot already carries an item.
error-already-carrying-rule = The robot carries one item at a time.

error-no-item-here-title = No item lies on the cell of the robot.
error-no-item-here-rule = pick_up() needs an item on the cell of the robot.

error-not-carrying-title = The robot carries no item.
error-not-carrying-rule = drop() needs an item carried by the robot.

error-item-already-here-title = An item already lies on the cell of the robot.
error-item-already-here-rule = A cell holds one item at a time.

# $function (String): the built-in function. $found (String): the type of the value it was given.
error-value-not-color-title = { $function } is given { $found ->
        [number] a number
        [text] a text
       *[boolean] a boolean
    }, not a color.
error-value-not-color-rule = { $function } takes a color: red, yellow or blue.

# $limit (Number): the most characters of a line.
error-line-too-long-title = This line of print would be longer than { $limit } characters.
error-line-too-long-rule = print writes { $limit } characters on a line at most, the spaces between its values counted.

# What the checks rule out, or a mistake of Stepwise: never for a program that the checks let
# run.
error-internal-title = Stepwise stopped the program by mistake.
error-internal-rule = This isn’t an error of the program, but one of Stepwise.
