#!/usr/bin/env node
import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
/******/ var __webpack_modules__ = ({

/***/ 429:
/***/ ((__unused_webpack_module, exports) => {

var __webpack_unused_export__;


__webpack_unused_export__ = ({
  value: true
});
function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
class Position {
  constructor(line, col, index) {
    this.line = void 0;
    this.column = void 0;
    this.index = void 0;
    this.line = line;
    this.column = col;
    this.index = index;
  }
}
class SourceLocation {
  constructor(start, end) {
    this.start = void 0;
    this.end = void 0;
    this.filename = void 0;
    this.identifierName = void 0;
    this.start = start;
    this.end = end;
  }
}
function createPositionWithColumnOffset(position, columnOffset) {
  const {
    line,
    column,
    index
  } = position;
  return new Position(line, column + columnOffset, index + columnOffset);
}
const code = "BABEL_PARSER_SOURCETYPE_MODULE_REQUIRED";
var ModuleErrors = {
  ImportMetaOutsideModule: {
    message: `import.meta may appear only with 'sourceType: "module"'`,
    code
  },
  ImportOutsideModule: {
    message: `'import' and 'export' may appear only with 'sourceType: "module"'`,
    code
  }
};
const NodeDescriptions = {
  ArrayPattern: "array destructuring pattern",
  AssignmentExpression: "assignment expression",
  AssignmentPattern: "assignment expression",
  ArrowFunctionExpression: "arrow function expression",
  ConditionalExpression: "conditional expression",
  CatchClause: "catch clause",
  ForOfStatement: "for-of statement",
  ForInStatement: "for-in statement",
  ForStatement: "for-loop",
  FormalParameters: "function parameter list",
  Identifier: "identifier",
  ImportSpecifier: "import specifier",
  ImportDefaultSpecifier: "import default specifier",
  ImportNamespaceSpecifier: "import namespace specifier",
  ObjectPattern: "object destructuring pattern",
  ParenthesizedExpression: "parenthesized expression",
  RestElement: "rest element",
  UpdateExpression: {
    true: "prefix operation",
    false: "postfix operation"
  },
  VariableDeclarator: "variable declaration",
  YieldExpression: "yield expression"
};
const toNodeDescription = node => node.type === "UpdateExpression" ? NodeDescriptions.UpdateExpression[`${node.prefix}`] : NodeDescriptions[node.type];
var StandardErrors = {
  AccessorIsGenerator: ({
    kind
  }) => `A ${kind}ter cannot be a generator.`,
  ArgumentsInClass: "'arguments' is only allowed in functions and class methods.",
  AsyncFunctionInSingleStatementContext: "Async functions can only be declared at the top level or inside a block.",
  AwaitBindingIdentifier: "Can not use 'await' as identifier inside an async function.",
  AwaitBindingIdentifierInStaticBlock: "Can not use 'await' as identifier inside a static block.",
  AwaitExpressionFormalParameter: "'await' is not allowed in async function parameters.",
  AwaitUsingNotInAsyncContext: "'await using' is only allowed within async functions and at the top levels of modules.",
  AwaitNotInAsyncContext: "'await' is only allowed within async functions and at the top levels of modules.",
  BadGetterArity: "A 'get' accessor must not have any formal parameters.",
  BadSetterArity: "A 'set' accessor must have exactly one formal parameter.",
  BadSetterRestParameter: "A 'set' accessor function argument must not be a rest parameter.",
  ConstructorClassField: "Classes may not have a field named 'constructor'.",
  ConstructorClassPrivateField: "Classes may not have a private field named '#constructor'.",
  ConstructorIsAccessor: "Class constructor may not be an accessor.",
  ConstructorIsAsync: "Constructor can't be an async function.",
  ConstructorIsGenerator: "Constructor can't be a generator.",
  DeclarationMissingInitializer: ({
    kind
  }) => `Missing initializer in ${kind} declaration.`,
  DecoratorArgumentsOutsideParentheses: "Decorator arguments must be moved inside parentheses: use '@(decorator(args))' instead of '@(decorator)(args)'.",
  DecoratorBeforeExport: "Decorators must be placed *before* the 'export' keyword. Remove the 'decoratorsBeforeExport: true' option to use the 'export @decorator class {}' syntax.",
  DecoratorsBeforeAfterExport: "Decorators can be placed *either* before or after the 'export' keyword, but not in both locations at the same time.",
  DecoratorConstructor: "Decorators can't be used with a constructor. Did you mean '@dec class { ... }'?",
  DecoratorExportClass: "Decorators must be placed *after* the 'export' keyword. Remove the 'decoratorsBeforeExport: false' option to use the '@decorator export class {}' syntax.",
  DecoratorSemicolon: "Decorators must not be followed by a semicolon.",
  DecoratorStaticBlock: "Decorators can't be used with a static block.",
  DeferImportRequiresNamespace: 'Only `import defer * as x from "./module"` is valid.',
  DeletePrivateField: "Deleting a private field is not allowed.",
  DestructureNamedImport: "ES2015 named imports do not destructure. Use another statement for destructuring after the import.",
  DuplicateConstructor: "Duplicate constructor in the same class.",
  DuplicateDefaultExport: "Only one default export allowed per module.",
  DuplicateExport: ({
    exportName
  }) => `\`${exportName}\` has already been exported. Exported identifiers must be unique.`,
  DuplicateProto: "Redefinition of __proto__ property.",
  DuplicateRegExpFlags: "Duplicate regular expression flag.",
  ElementAfterRest: "Rest element must be last element.",
  EscapedCharNotAnIdentifier: "Invalid Unicode escape.",
  ExportBindingIsString: ({
    localName,
    exportName
  }) => `A string literal cannot be used as an exported binding without \`from\`.\n- Did you mean \`export { '${localName}' as '${exportName}' } from 'some-module'\`?`,
  ExportDefaultFromAsIdentifier: "'from' is not allowed as an identifier after 'export default'.",
  ForInOfLoopInitializer: ({
    type
  }) => `'${type === "ForInStatement" ? "for-in" : "for-of"}' loop variable declaration may not have an initializer.`,
  ForInUsing: "For-in loop may not start with 'using' declaration.",
  ForOfAsync: "The left-hand side of a for-of loop may not be 'async'.",
  ForOfLet: "The left-hand side of a for-of loop may not start with 'let'.",
  GeneratorInSingleStatementContext: "Generators can only be declared at the top level or inside a block.",
  IllegalBreakContinue: ({
    type
  }) => `Unsyntactic ${type === "BreakStatement" ? "break" : "continue"}.`,
  IllegalLanguageModeDirective: "Illegal 'use strict' directive in function with non-simple parameter list.",
  IllegalReturn: "'return' outside of function.",
  ImportAttributesUseAssert: "The `assert` keyword in import attributes is deprecated and it has been replaced by the `with` keyword. You can enable the `deprecatedImportAssert` parser plugin to suppress this error.",
  ImportBindingIsString: ({
    importName
  }) => `A string literal cannot be used as an imported binding.\n- Did you mean \`import { "${importName}" as foo }\`?`,
  ImportCallArity: `\`import()\` requires exactly one or two arguments.`,
  ImportCallNotNewExpression: "Cannot use new with import(...).",
  ImportCallSpreadArgument: "`...` is not allowed in `import()`.",
  ImportJSONBindingNotDefault: "A JSON module can only be imported with `default`.",
  ImportReflectionHasAssertion: "`import module x` cannot have assertions.",
  ImportReflectionNotBinding: 'Only `import module x from "./module"` is valid.',
  IncompatibleRegExpUVFlags: "The 'u' and 'v' regular expression flags cannot be enabled at the same time.",
  InvalidBigIntLiteral: "Invalid BigIntLiteral.",
  InvalidCodePoint: "Code point out of bounds.",
  InvalidCoverDiscardElement: "'void' must be followed by an expression when not used in a binding position.",
  InvalidCoverInitializedName: "Invalid shorthand property initializer.",
  InvalidDecimal: "Invalid decimal.",
  InvalidDigit: ({
    radix
  }) => `Expected number in radix ${radix}.`,
  InvalidEscapeSequence: "Bad character escape sequence.",
  InvalidEscapeSequenceTemplate: "Invalid escape sequence in template.",
  InvalidEscapedReservedWord: ({
    reservedWord
  }) => `Escape sequence in keyword ${reservedWord}.`,
  InvalidIdentifier: ({
    identifierName
  }) => `Invalid identifier ${identifierName}.`,
  InvalidLhs: ({
    ancestor
  }) => `Invalid left-hand side in ${toNodeDescription(ancestor)}.`,
  InvalidLhsBinding: ({
    ancestor
  }) => `Binding invalid left-hand side in ${toNodeDescription(ancestor)}.`,
  InvalidLhsOptionalChaining: ({
    ancestor
  }) => `Invalid optional chaining in the left-hand side of ${toNodeDescription(ancestor)}.`,
  InvalidNumber: "Invalid number.",
  InvalidOrMissingExponent: "Floating-point numbers require a valid exponent after the 'e'.",
  InvalidOrUnexpectedToken: ({
    unexpected
  }) => `Unexpected character '${unexpected}'.`,
  InvalidParenthesizedAssignment: "Invalid parenthesized assignment pattern.",
  InvalidPrivateFieldResolution: ({
    identifierName
  }) => `Private name #${identifierName} is not defined.`,
  InvalidPropertyBindingPattern: "Binding member expression.",
  InvalidRecordProperty: "Only properties and spread elements are allowed in record definitions.",
  InvalidRestAssignmentPattern: "Invalid rest operator's argument.",
  LabelRedeclaration: ({
    labelName
  }) => `Label '${labelName}' is already declared.`,
  LetInLexicalBinding: "'let' is disallowed as a lexically bound name.",
  LineTerminatorBeforeArrow: "No line break is allowed before '=>'.",
  MalformedRegExpFlags: "Invalid regular expression flag.",
  MissingClassName: "A class name is required.",
  MissingEqInAssignment: "Only '=' operator can be used for specifying default value.",
  MissingSemicolon: "Missing semicolon.",
  MissingPlugin: ({
    missingPlugin
  }) => `This experimental syntax requires enabling the parser plugin: ${missingPlugin.map(name => JSON.stringify(name)).join(", ")}.`,
  MissingOneOfPlugins: ({
    missingPlugin
  }) => `This experimental syntax requires enabling one of the following parser plugin(s): ${missingPlugin.map(name => JSON.stringify(name)).join(", ")}.`,
  MissingUnicodeEscape: "Expecting Unicode escape sequence \\uXXXX.",
  MixingCoalesceWithLogical: "Nullish coalescing operator(??) requires parens when mixing with logical operators.",
  ModuleAttributeDifferentFromType: "The only accepted module attribute is `type`.",
  ModuleAttributeInvalidValue: "Only string literals are allowed as module attribute values.",
  ModuleAttributesWithDuplicateKeys: ({
    key
  }) => `Duplicate key "${key}" is not allowed in module attributes.`,
  ModuleExportNameHasLoneSurrogate: ({
    surrogateCharCode
  }) => `An export name cannot include a lone surrogate, found '\\u${surrogateCharCode.toString(16)}'.`,
  ModuleExportUndefined: ({
    localName
  }) => `Export '${localName}' is not defined.`,
  MultipleDefaultsInSwitch: "Multiple default clauses.",
  NewlineAfterThrow: "Illegal newline after throw.",
  NoCatchOrFinally: "Missing catch or finally clause.",
  NumberIdentifier: "Identifier directly after number.",
  NumericSeparatorInEscapeSequence: "Numeric separators are not allowed inside unicode escape sequences or hex escape sequences.",
  ObsoleteAwaitStar: "'await*' has been removed from the async functions proposal. Use Promise.all() instead.",
  OptionalChainingNoNew: "Constructors in/after an Optional Chain are not allowed.",
  OptionalChainingNoTemplate: "Tagged Template Literals are not allowed in optionalChain.",
  OverrideOnConstructor: "'override' modifier cannot appear on a constructor declaration.",
  ParamDupe: "Argument name clash.",
  PatternHasAccessor: "Object pattern can't contain getter or setter.",
  PatternHasMethod: "Object pattern can't contain methods.",
  PrivateInExpectedIn: ({
    identifierName
  }) => `Private names are only allowed in property accesses (\`obj.#${identifierName}\`) or in \`in\` expressions (\`#${identifierName} in obj\`).`,
  PrivateNameRedeclaration: ({
    identifierName
  }) => `Duplicate private name #${identifierName}.`,
  RecordExpressionBarIncorrectEndSyntaxType: "Record expressions ending with '|}' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'bar'.",
  RecordExpressionBarIncorrectStartSyntaxType: "Record expressions starting with '{|' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'bar'.",
  RecordExpressionHashIncorrectStartSyntaxType: "Record expressions starting with '#{' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'hash'.",
  RecordNoProto: "'__proto__' is not allowed in Record expressions.",
  RestTrailingComma: "Unexpected trailing comma after rest element.",
  SloppyFunction: "In non-strict mode code, functions can only be declared at top level or inside a block.",
  SloppyFunctionAnnexB: "In non-strict mode code, functions can only be declared at top level, inside a block, or as the body of an if statement.",
  SourcePhaseImportRequiresDefault: 'Only `import source x from "./module"` is valid.',
  StaticPrototype: "Classes may not have static property named prototype.",
  SuperCallNotNewExpression: "Cannot use new with super(...).",
  SuperNotAllowed: "`super()` is only valid inside a class constructor of a subclass. Maybe a typo in the method name ('constructor') or not extending another class?",
  SuperPrivateField: "Private fields can't be accessed on super.",
  TrailingDecorator: "Decorators must be attached to a class element.",
  TupleExpressionBarIncorrectEndSyntaxType: "Tuple expressions ending with '|]' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'bar'.",
  TupleExpressionBarIncorrectStartSyntaxType: "Tuple expressions starting with '[|' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'bar'.",
  TupleExpressionHashIncorrectStartSyntaxType: "Tuple expressions starting with '#[' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'hash'.",
  UnexpectedArgumentPlaceholder: "Unexpected argument placeholder.",
  UnexpectedAwaitAfterPipelineBody: 'Unexpected "await" after pipeline body; await must have parentheses in minimal proposal.',
  UnexpectedDigitAfterHash: "Unexpected digit after hash token.",
  UnexpectedImportExport: "'import' and 'export' may only appear at the top level.",
  UnexpectedKeyword: ({
    keyword
  }) => `Unexpected keyword '${keyword}'.`,
  UnexpectedLeadingDecorator: "Leading decorators must be attached to a class declaration.",
  UnexpectedLexicalDeclaration: "Lexical declaration cannot appear in a single-statement context.",
  UnexpectedNewTarget: "`new.target` can only be used in functions or class properties.",
  UnexpectedNumericSeparator: "A numeric separator is only allowed between two digits.",
  UnexpectedPrivateField: "Unexpected private name.",
  UnexpectedReservedWord: ({
    reservedWord
  }) => `Unexpected reserved word '${reservedWord}'.`,
  UnexpectedSuper: "'super' is only allowed in object methods and classes.",
  UnexpectedToken: ({
    expected,
    unexpected
  }) => `Unexpected token${unexpected ? ` '${unexpected}'.` : ""}${expected ? `, expected "${expected}"` : ""}`,
  UnexpectedTokenUnaryExponentiation: "Illegal expression. Wrap left hand side or entire exponentiation in parentheses.",
  UnexpectedUsingDeclaration: "Using declaration cannot appear in the top level when source type is `script` or in the bare case statement.",
  UnexpectedVoidPattern: "Unexpected void binding.",
  UnsupportedDecoratorExport: "A decorated export must export a class declaration.",
  UnsupportedDefaultExport: "Only expressions, functions or classes are allowed as the `default` export.",
  UnsupportedImport: "`import` can only be used in `import()` or `import.meta`.",
  UnsupportedMetaProperty: ({
    target,
    onlyValidPropertyName
  }) => `The only valid meta property for ${target} is ${target}.${onlyValidPropertyName}.`,
  UnsupportedParameterDecorator: "Decorators cannot be used to decorate parameters.",
  UnsupportedPropertyDecorator: "Decorators cannot be used to decorate object literal properties.",
  UnsupportedSuper: "'super' can only be used with function calls (i.e. super()) or in property accesses (i.e. super.prop or super[prop]).",
  UnterminatedComment: "Unterminated comment.",
  UnterminatedRegExp: "Unterminated regular expression.",
  UnterminatedString: "Unterminated string constant.",
  UnterminatedTemplate: "Unterminated template.",
  UsingDeclarationExport: "Using declaration cannot be exported.",
  UsingDeclarationHasBindingPattern: "Using declaration cannot have destructuring patterns.",
  VarRedeclaration: ({
    identifierName
  }) => `Identifier '${identifierName}' has already been declared.`,
  VoidPatternCatchClauseParam: "A void binding can not be the catch clause parameter. Use `try { ... } catch { ... }` if you want to discard the caught error.",
  VoidPatternInitializer: "A void binding may not have an initializer.",
  YieldBindingIdentifier: "Can not use 'yield' as identifier inside a generator.",
  YieldInParameter: "Yield expression is not allowed in formal parameters.",
  YieldNotInGeneratorFunction: "'yield' is only allowed within generator functions.",
  ZeroDigitNumericSeparator: "Numeric separator can not be used after leading 0."
};
var StrictModeErrors = {
  StrictDelete: "Deleting local variable in strict mode.",
  StrictEvalArguments: ({
    referenceName
  }) => `Assigning to '${referenceName}' in strict mode.`,
  StrictEvalArgumentsBinding: ({
    bindingName
  }) => `Binding '${bindingName}' in strict mode.`,
  StrictFunction: "In strict mode code, functions can only be declared at top level or inside a block.",
  StrictNumericEscape: "The only valid numeric escape in strict mode is '\\0'.",
  StrictOctalLiteral: "Legacy octal literals are not allowed in strict mode.",
  StrictWith: "'with' in strict mode."
};
var ParseExpressionErrors = {
  ParseExpressionEmptyInput: "Unexpected parseExpression() input: The input is empty or contains only comments.",
  ParseExpressionExpectsEOF: ({
    unexpected
  }) => `Unexpected parseExpression() input: The input should contain exactly one expression, but the first expression is followed by the unexpected character \`${String.fromCodePoint(unexpected)}\`.`
};
const UnparenthesizedPipeBodyDescriptions = new Set(["ArrowFunctionExpression", "AssignmentExpression", "ConditionalExpression", "YieldExpression"]);
var PipelineOperatorErrors = Object.assign({
  PipeBodyIsTighter: "Unexpected yield after pipeline body; any yield expression acting as Hack-style pipe body must be parenthesized due to its loose operator precedence.",
  PipeTopicRequiresHackPipes: 'Topic reference is used, but the pipelineOperator plugin was not passed a "proposal": "hack" or "smart" option.',
  PipeTopicUnbound: "Topic reference is unbound; it must be inside a pipe body.",
  PipeTopicUnconfiguredToken: ({
    token
  }) => `Invalid topic token ${token}. In order to use ${token} as a topic reference, the pipelineOperator plugin must be configured with { "proposal": "hack", "topicToken": "${token}" }.`,
  PipeTopicUnused: "Hack-style pipe body does not contain a topic reference; Hack-style pipes must use topic at least once.",
  PipeUnparenthesizedBody: ({
    type
  }) => `Hack-style pipe body cannot be an unparenthesized ${toNodeDescription({
    type
  })}; please wrap it in parentheses.`
}, {
  PipelineBodyNoArrow: 'Unexpected arrow "=>" after pipeline body; arrow function in pipeline body must be parenthesized.',
  PipelineBodySequenceExpression: "Pipeline body may not be a comma-separated sequence expression.",
  PipelineHeadSequenceExpression: "Pipeline head should not be a comma-separated sequence expression.",
  PipelineTopicUnused: "Pipeline is in topic style but does not use topic reference.",
  PrimaryTopicNotAllowed: "Topic reference was used in a lexical context without topic binding.",
  PrimaryTopicRequiresSmartPipeline: 'Topic reference is used, but the pipelineOperator plugin was not passed a "proposal": "hack" or "smart" option.'
});
var FunctionBindErrors = {
  UnsupportedBind: "Binding should be performed on object property.",
  UnsupportedBindRHS: "The right-hand side of binding can not be super or import."
};
const _excluded = ["message"];
function defineHidden(obj, key, value) {
  Object.defineProperty(obj, key, {
    enumerable: false,
    configurable: true,
    value
  });
}
function toParseErrorConstructor({
  toMessage,
  code,
  reasonCode,
  syntaxPlugin
}) {
  const hasMissingPlugin = reasonCode === "MissingPlugin" || reasonCode === "MissingOneOfPlugins";
  const oldReasonCodes = {
    AccessorCannotDeclareThisParameter: "AccesorCannotDeclareThisParameter",
    AccessorCannotHaveTypeParameters: "AccesorCannotHaveTypeParameters",
    ConstInitializerMustBeStringOrNumericLiteralOrLiteralEnumReference: "ConstInitiailizerMustBeStringOrNumericLiteralOrLiteralEnumReference",
    SetAccessorCannotHaveOptionalParameter: "SetAccesorCannotHaveOptionalParameter",
    SetAccessorCannotHaveRestParameter: "SetAccesorCannotHaveRestParameter",
    SetAccessorCannotHaveReturnType: "SetAccesorCannotHaveReturnType"
  };
  if (oldReasonCodes[reasonCode]) {
    reasonCode = oldReasonCodes[reasonCode];
  }
  return function constructor(loc, details) {
    const error = new SyntaxError();
    error.code = code;
    error.reasonCode = reasonCode;
    error.loc = loc;
    error.pos = loc.index;
    error.syntaxPlugin = syntaxPlugin;
    if (hasMissingPlugin) {
      error.missingPlugin = details.missingPlugin;
    }
    defineHidden(error, "clone", function clone(overrides = {}) {
      var _overrides$loc;
      const {
        line,
        column,
        index
      } = (_overrides$loc = overrides.loc) != null ? _overrides$loc : loc;
      return constructor(new Position(line, column, index), Object.assign({}, details, overrides.details));
    });
    defineHidden(error, "details", details);
    Object.defineProperty(error, "message", {
      configurable: true,
      get() {
        const message = `${toMessage(details)} (${loc.line}:${loc.column})`;
        this.message = message;
        return message;
      },
      set(value) {
        Object.defineProperty(this, "message", {
          value,
          writable: true
        });
      }
    });
    return error;
  };
}
function ParseErrorEnum(argument, syntaxPlugin) {
  if (Array.isArray(argument)) {
    return parseErrorTemplates => ParseErrorEnum(parseErrorTemplates, argument[0]);
  }
  const ParseErrorConstructors = {};
  for (const reasonCode of Object.keys(argument)) {
    const template = argument[reasonCode];
    const _ref = typeof template === "string" ? {
        message: () => template
      } : typeof template === "function" ? {
        message: template
      } : template,
      {
        message
      } = _ref,
      rest = _objectWithoutPropertiesLoose(_ref, _excluded);
    const toMessage = typeof message === "string" ? () => message : message;
    ParseErrorConstructors[reasonCode] = toParseErrorConstructor(Object.assign({
      code: "BABEL_PARSER_SYNTAX_ERROR",
      reasonCode,
      toMessage
    }, syntaxPlugin ? {
      syntaxPlugin
    } : {}, rest));
  }
  return ParseErrorConstructors;
}
const Errors = Object.assign({}, ParseErrorEnum(ModuleErrors), ParseErrorEnum(StandardErrors), ParseErrorEnum(StrictModeErrors), ParseErrorEnum(ParseExpressionErrors), ParseErrorEnum`pipelineOperator`(PipelineOperatorErrors), ParseErrorEnum`functionBind`(FunctionBindErrors));
function createDefaultOptions() {
  return {
    sourceType: "script",
    sourceFilename: undefined,
    startIndex: 0,
    startColumn: 0,
    startLine: 1,
    allowAwaitOutsideFunction: false,
    allowReturnOutsideFunction: false,
    allowNewTargetOutsideFunction: false,
    allowImportExportEverywhere: false,
    allowSuperOutsideMethod: false,
    allowUndeclaredExports: false,
    allowYieldOutsideFunction: false,
    plugins: [],
    strictMode: undefined,
    ranges: false,
    tokens: false,
    createImportExpressions: false,
    createParenthesizedExpressions: false,
    errorRecovery: false,
    attachComment: true,
    annexB: true
  };
}
function getOptions(opts) {
  const options = createDefaultOptions();
  if (opts == null) {
    return options;
  }
  if (opts.annexB != null && opts.annexB !== false) {
    throw new Error("The `annexB` option can only be set to `false`.");
  }
  for (const key of Object.keys(options)) {
    if (opts[key] != null) options[key] = opts[key];
  }
  if (options.startLine === 1) {
    if (opts.startIndex == null && options.startColumn > 0) {
      options.startIndex = options.startColumn;
    } else if (opts.startColumn == null && options.startIndex > 0) {
      options.startColumn = options.startIndex;
    }
  } else if (opts.startColumn == null || opts.startIndex == null) {
    if (opts.startIndex != null) {
      throw new Error("With a `startLine > 1` you must also specify `startIndex` and `startColumn`.");
    }
  }
  if (options.sourceType === "commonjs") {
    if (opts.allowAwaitOutsideFunction != null) {
      throw new Error("The `allowAwaitOutsideFunction` option cannot be used with `sourceType: 'commonjs'`.");
    }
    if (opts.allowReturnOutsideFunction != null) {
      throw new Error("`sourceType: 'commonjs'` implies `allowReturnOutsideFunction: true`, please remove the `allowReturnOutsideFunction` option or use `sourceType: 'script'`.");
    }
    if (opts.allowNewTargetOutsideFunction != null) {
      throw new Error("`sourceType: 'commonjs'` implies `allowNewTargetOutsideFunction: true`, please remove the `allowNewTargetOutsideFunction` option or use `sourceType: 'script'`.");
    }
  }
  return options;
}
const {
  defineProperty
} = Object;
const toUnenumerable = (object, key) => {
  if (object) {
    defineProperty(object, key, {
      enumerable: false,
      value: object[key]
    });
  }
};
function toESTreeLocation(node) {
  toUnenumerable(node.loc.start, "index");
  toUnenumerable(node.loc.end, "index");
  return node;
}
var estree = superClass => class ESTreeParserMixin extends superClass {
  parse() {
    const file = toESTreeLocation(super.parse());
    if (this.optionFlags & 256) {
      file.tokens = file.tokens.map(toESTreeLocation);
    }
    return file;
  }
  parseRegExpLiteral({
    pattern,
    flags
  }) {
    let regex = null;
    try {
      regex = new RegExp(pattern, flags);
    } catch (_) {}
    const node = this.estreeParseLiteral(regex);
    node.regex = {
      pattern,
      flags
    };
    return node;
  }
  parseBigIntLiteral(value) {
    let bigInt;
    try {
      bigInt = BigInt(value);
    } catch (_unused) {
      bigInt = null;
    }
    const node = this.estreeParseLiteral(bigInt);
    node.bigint = String(node.value || value);
    return node;
  }
  parseDecimalLiteral(value) {
    const decimal = null;
    const node = this.estreeParseLiteral(decimal);
    node.decimal = String(node.value || value);
    return node;
  }
  estreeParseLiteral(value) {
    return this.parseLiteral(value, "Literal");
  }
  parseStringLiteral(value) {
    return this.estreeParseLiteral(value);
  }
  parseNumericLiteral(value) {
    return this.estreeParseLiteral(value);
  }
  parseNullLiteral() {
    return this.estreeParseLiteral(null);
  }
  parseBooleanLiteral(value) {
    return this.estreeParseLiteral(value);
  }
  estreeParseChainExpression(node, endLoc) {
    const chain = this.startNodeAtNode(node);
    chain.expression = node;
    return this.finishNodeAt(chain, "ChainExpression", endLoc);
  }
  directiveToStmt(directive) {
    const expression = directive.value;
    delete directive.value;
    this.castNodeTo(expression, "Literal");
    expression.raw = expression.extra.raw;
    expression.value = expression.extra.expressionValue;
    const stmt = this.castNodeTo(directive, "ExpressionStatement");
    stmt.expression = expression;
    stmt.directive = expression.extra.rawValue;
    delete expression.extra;
    return stmt;
  }
  fillOptionalPropertiesForTSESLint(node) {}
  cloneEstreeStringLiteral(node) {
    const {
      start,
      end,
      loc,
      range,
      raw,
      value
    } = node;
    const cloned = Object.create(node.constructor.prototype);
    cloned.type = "Literal";
    cloned.start = start;
    cloned.end = end;
    cloned.loc = loc;
    cloned.range = range;
    cloned.raw = raw;
    cloned.value = value;
    return cloned;
  }
  initFunction(node, isAsync) {
    super.initFunction(node, isAsync);
    node.expression = false;
  }
  checkDeclaration(node) {
    if (node != null && this.isObjectProperty(node)) {
      this.checkDeclaration(node.value);
    } else {
      super.checkDeclaration(node);
    }
  }
  getObjectOrClassMethodParams(method) {
    return method.value.params;
  }
  isValidDirective(stmt) {
    var _stmt$expression$extr;
    return stmt.type === "ExpressionStatement" && stmt.expression.type === "Literal" && typeof stmt.expression.value === "string" && !((_stmt$expression$extr = stmt.expression.extra) != null && _stmt$expression$extr.parenthesized);
  }
  parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse) {
    super.parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse);
    const directiveStatements = node.directives.map(d => this.directiveToStmt(d));
    node.body = directiveStatements.concat(node.body);
    delete node.directives;
  }
  parsePrivateName() {
    const node = super.parsePrivateName();
    if (!this.getPluginOption("estree", "classFeatures")) {
      return node;
    }
    return this.convertPrivateNameToPrivateIdentifier(node);
  }
  convertPrivateNameToPrivateIdentifier(node) {
    const name = super.getPrivateNameSV(node);
    delete node.id;
    node.name = name;
    return this.castNodeTo(node, "PrivateIdentifier");
  }
  isPrivateName(node) {
    if (!this.getPluginOption("estree", "classFeatures")) {
      return super.isPrivateName(node);
    }
    return node.type === "PrivateIdentifier";
  }
  getPrivateNameSV(node) {
    if (!this.getPluginOption("estree", "classFeatures")) {
      return super.getPrivateNameSV(node);
    }
    return node.name;
  }
  parseLiteral(value, type) {
    const node = super.parseLiteral(value, type);
    node.raw = node.extra.raw;
    delete node.extra;
    return node;
  }
  parseFunctionBody(node, allowExpression, isMethod = false) {
    super.parseFunctionBody(node, allowExpression, isMethod);
    node.expression = node.body.type !== "BlockStatement";
  }
  parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope = false) {
    let funcNode = this.startNode();
    funcNode.kind = node.kind;
    funcNode = super.parseMethod(funcNode, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope);
    delete funcNode.kind;
    const {
      typeParameters
    } = node;
    if (typeParameters) {
      delete node.typeParameters;
      funcNode.typeParameters = typeParameters;
      this.resetStartLocationFromNode(funcNode, typeParameters);
    }
    const valueNode = this.castNodeTo(funcNode, "FunctionExpression");
    node.value = valueNode;
    if (type === "ClassPrivateMethod") {
      node.computed = false;
    }
    if (type === "ObjectMethod") {
      if (node.kind === "method") {
        node.kind = "init";
      }
      node.shorthand = false;
      return this.finishNode(node, "Property");
    } else {
      return this.finishNode(node, "MethodDefinition");
    }
  }
  nameIsConstructor(key) {
    if (key.type === "Literal") return key.value === "constructor";
    return super.nameIsConstructor(key);
  }
  parseClassProperty(...args) {
    const propertyNode = super.parseClassProperty(...args);
    if (!this.getPluginOption("estree", "classFeatures")) {
      return propertyNode;
    }
    this.castNodeTo(propertyNode, "PropertyDefinition");
    return propertyNode;
  }
  parseClassPrivateProperty(...args) {
    const propertyNode = super.parseClassPrivateProperty(...args);
    if (!this.getPluginOption("estree", "classFeatures")) {
      return propertyNode;
    }
    this.castNodeTo(propertyNode, "PropertyDefinition");
    propertyNode.computed = false;
    return propertyNode;
  }
  parseClassAccessorProperty(node) {
    const accessorPropertyNode = super.parseClassAccessorProperty(node);
    if (!this.getPluginOption("estree", "classFeatures")) {
      return accessorPropertyNode;
    }
    if (accessorPropertyNode.abstract && this.hasPlugin("typescript")) {
      delete accessorPropertyNode.abstract;
      this.castNodeTo(accessorPropertyNode, "TSAbstractAccessorProperty");
    } else {
      this.castNodeTo(accessorPropertyNode, "AccessorProperty");
    }
    return accessorPropertyNode;
  }
  parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors) {
    const node = super.parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors);
    if (node) {
      node.kind = "init";
      this.castNodeTo(node, "Property");
    }
    return node;
  }
  finishObjectProperty(node) {
    node.kind = "init";
    return this.finishNode(node, "Property");
  }
  isValidLVal(type, disallowCallExpression, isUnparenthesizedInAssign, binding) {
    return type === "Property" ? "value" : super.isValidLVal(type, disallowCallExpression, isUnparenthesizedInAssign, binding);
  }
  isAssignable(node, isBinding) {
    if (node != null && this.isObjectProperty(node)) {
      return this.isAssignable(node.value, isBinding);
    }
    return super.isAssignable(node, isBinding);
  }
  toAssignable(node, isLHS = false) {
    if (node != null && this.isObjectProperty(node)) {
      const {
        key,
        value
      } = node;
      if (this.isPrivateName(key)) {
        this.classScope.usePrivateName(this.getPrivateNameSV(key), key.loc.start);
      }
      this.toAssignable(value, isLHS);
    } else {
      super.toAssignable(node, isLHS);
    }
  }
  toAssignableObjectExpressionProp(prop, isLast, isLHS) {
    if (prop.type === "Property" && (prop.kind === "get" || prop.kind === "set")) {
      this.raise(Errors.PatternHasAccessor, prop.key);
    } else if (prop.type === "Property" && prop.method) {
      this.raise(Errors.PatternHasMethod, prop.key);
    } else {
      super.toAssignableObjectExpressionProp(prop, isLast, isLHS);
    }
  }
  finishCallExpression(unfinished, optional) {
    const node = super.finishCallExpression(unfinished, optional);
    if (node.callee.type === "Import") {
      var _ref, _ref2;
      this.castNodeTo(node, "ImportExpression");
      node.source = node.arguments[0];
      node.options = (_ref = node.arguments[1]) != null ? _ref : null;
      node.attributes = (_ref2 = node.arguments[1]) != null ? _ref2 : null;
      delete node.arguments;
      delete node.callee;
    } else if (node.type === "OptionalCallExpression") {
      this.castNodeTo(node, "CallExpression");
    } else {
      node.optional = false;
    }
    return node;
  }
  toReferencedArguments(node) {
    if (node.type === "ImportExpression") {
      return;
    }
    super.toReferencedArguments(node);
  }
  parseExport(unfinished, decorators) {
    const exportStartLoc = this.state.lastTokStartLoc;
    const node = super.parseExport(unfinished, decorators);
    switch (node.type) {
      case "ExportAllDeclaration":
        node.exported = null;
        break;
      case "ExportNamedDeclaration":
        if (node.specifiers.length === 1 && node.specifiers[0].type === "ExportNamespaceSpecifier") {
          this.castNodeTo(node, "ExportAllDeclaration");
          node.exported = node.specifiers[0].exported;
          delete node.specifiers;
        }
      case "ExportDefaultDeclaration":
        {
          var _declaration$decorato;
          const {
            declaration
          } = node;
          if ((declaration == null ? void 0 : declaration.type) === "ClassDeclaration" && ((_declaration$decorato = declaration.decorators) == null ? void 0 : _declaration$decorato.length) > 0 && declaration.start === node.start) {
            this.resetStartLocation(node, exportStartLoc);
          }
        }
        break;
    }
    return node;
  }
  stopParseSubscript(base, state) {
    const node = super.stopParseSubscript(base, state);
    if (state.optionalChainMember) {
      return this.estreeParseChainExpression(node, base.loc.end);
    }
    return node;
  }
  parseMember(base, startLoc, state, computed, optional) {
    const node = super.parseMember(base, startLoc, state, computed, optional);
    if (node.type === "OptionalMemberExpression") {
      this.castNodeTo(node, "MemberExpression");
    } else {
      node.optional = false;
    }
    return node;
  }
  isOptionalMemberExpression(node) {
    if (node.type === "ChainExpression") {
      return node.expression.type === "MemberExpression";
    }
    return super.isOptionalMemberExpression(node);
  }
  hasPropertyAsPrivateName(node) {
    if (node.type === "ChainExpression") {
      node = node.expression;
    }
    return super.hasPropertyAsPrivateName(node);
  }
  isObjectProperty(node) {
    return node.type === "Property" && node.kind === "init" && !node.method;
  }
  isObjectMethod(node) {
    return node.type === "Property" && (node.method || node.kind === "get" || node.kind === "set");
  }
  castNodeTo(node, type) {
    const result = super.castNodeTo(node, type);
    this.fillOptionalPropertiesForTSESLint(result);
    return result;
  }
  cloneIdentifier(node) {
    const cloned = super.cloneIdentifier(node);
    this.fillOptionalPropertiesForTSESLint(cloned);
    return cloned;
  }
  cloneStringLiteral(node) {
    if (node.type === "Literal") {
      return this.cloneEstreeStringLiteral(node);
    }
    return super.cloneStringLiteral(node);
  }
  finishNodeAt(node, type, endLoc) {
    return toESTreeLocation(super.finishNodeAt(node, type, endLoc));
  }
  finishNode(node, type) {
    const result = super.finishNode(node, type);
    this.fillOptionalPropertiesForTSESLint(result);
    return result;
  }
  resetStartLocation(node, startLoc) {
    super.resetStartLocation(node, startLoc);
    toESTreeLocation(node);
  }
  resetEndLocation(node, endLoc = this.state.lastTokEndLoc) {
    super.resetEndLocation(node, endLoc);
    toESTreeLocation(node);
  }
};
class TokContext {
  constructor(token, preserveSpace) {
    this.token = void 0;
    this.preserveSpace = void 0;
    this.token = token;
    this.preserveSpace = !!preserveSpace;
  }
}
const types = {
  brace: new TokContext("{"),
  j_oTag: new TokContext("<tag"),
  j_cTag: new TokContext("</tag"),
  j_expr: new TokContext("<tag>...</tag>", true)
};
types.template = new TokContext("`", true);
const beforeExpr = true;
const startsExpr = true;
const isLoop = true;
const isAssign = true;
const prefix = true;
const postfix = true;
class ExportedTokenType {
  constructor(label, conf = {}) {
    this.label = void 0;
    this.keyword = void 0;
    this.beforeExpr = void 0;
    this.startsExpr = void 0;
    this.rightAssociative = void 0;
    this.isLoop = void 0;
    this.isAssign = void 0;
    this.prefix = void 0;
    this.postfix = void 0;
    this.binop = void 0;
    this.label = label;
    this.keyword = conf.keyword;
    this.beforeExpr = !!conf.beforeExpr;
    this.startsExpr = !!conf.startsExpr;
    this.rightAssociative = !!conf.rightAssociative;
    this.isLoop = !!conf.isLoop;
    this.isAssign = !!conf.isAssign;
    this.prefix = !!conf.prefix;
    this.postfix = !!conf.postfix;
    this.binop = conf.binop != null ? conf.binop : null;
    this.updateContext = null;
  }
}
const keywords$1 = new Map();
function createKeyword(name, options = {}) {
  options.keyword = name;
  const token = createToken(name, options);
  keywords$1.set(name, token);
  return token;
}
function createBinop(name, binop) {
  return createToken(name, {
    beforeExpr,
    binop
  });
}
let tokenTypeCounter = -1;
const tokenTypes = [];
const tokenLabels = [];
const tokenBinops = [];
const tokenBeforeExprs = [];
const tokenStartsExprs = [];
const tokenPrefixes = [];
function createToken(name, options = {}) {
  var _options$binop, _options$beforeExpr, _options$startsExpr, _options$prefix;
  ++tokenTypeCounter;
  tokenLabels.push(name);
  tokenBinops.push((_options$binop = options.binop) != null ? _options$binop : -1);
  tokenBeforeExprs.push((_options$beforeExpr = options.beforeExpr) != null ? _options$beforeExpr : false);
  tokenStartsExprs.push((_options$startsExpr = options.startsExpr) != null ? _options$startsExpr : false);
  tokenPrefixes.push((_options$prefix = options.prefix) != null ? _options$prefix : false);
  tokenTypes.push(new ExportedTokenType(name, options));
  return tokenTypeCounter;
}
function createKeywordLike(name, options = {}) {
  var _options$binop2, _options$beforeExpr2, _options$startsExpr2, _options$prefix2;
  ++tokenTypeCounter;
  keywords$1.set(name, tokenTypeCounter);
  tokenLabels.push(name);
  tokenBinops.push((_options$binop2 = options.binop) != null ? _options$binop2 : -1);
  tokenBeforeExprs.push((_options$beforeExpr2 = options.beforeExpr) != null ? _options$beforeExpr2 : false);
  tokenStartsExprs.push((_options$startsExpr2 = options.startsExpr) != null ? _options$startsExpr2 : false);
  tokenPrefixes.push((_options$prefix2 = options.prefix) != null ? _options$prefix2 : false);
  tokenTypes.push(new ExportedTokenType("name", options));
  return tokenTypeCounter;
}
const tt = {
  bracketL: createToken("[", {
    beforeExpr,
    startsExpr
  }),
  bracketHashL: createToken("#[", {
    beforeExpr,
    startsExpr
  }),
  bracketBarL: createToken("[|", {
    beforeExpr,
    startsExpr
  }),
  bracketR: createToken("]"),
  bracketBarR: createToken("|]"),
  braceL: createToken("{", {
    beforeExpr,
    startsExpr
  }),
  braceBarL: createToken("{|", {
    beforeExpr,
    startsExpr
  }),
  braceHashL: createToken("#{", {
    beforeExpr,
    startsExpr
  }),
  braceR: createToken("}"),
  braceBarR: createToken("|}"),
  parenL: createToken("(", {
    beforeExpr,
    startsExpr
  }),
  parenR: createToken(")"),
  comma: createToken(",", {
    beforeExpr
  }),
  semi: createToken(";", {
    beforeExpr
  }),
  colon: createToken(":", {
    beforeExpr
  }),
  doubleColon: createToken("::", {
    beforeExpr
  }),
  dot: createToken("."),
  question: createToken("?", {
    beforeExpr
  }),
  questionDot: createToken("?."),
  arrow: createToken("=>", {
    beforeExpr
  }),
  template: createToken("template"),
  ellipsis: createToken("...", {
    beforeExpr
  }),
  backQuote: createToken("`", {
    startsExpr
  }),
  dollarBraceL: createToken("${", {
    beforeExpr,
    startsExpr
  }),
  templateTail: createToken("...`", {
    startsExpr
  }),
  templateNonTail: createToken("...${", {
    beforeExpr,
    startsExpr
  }),
  at: createToken("@"),
  hash: createToken("#", {
    startsExpr
  }),
  interpreterDirective: createToken("#!..."),
  eq: createToken("=", {
    beforeExpr,
    isAssign
  }),
  assign: createToken("_=", {
    beforeExpr,
    isAssign
  }),
  slashAssign: createToken("_=", {
    beforeExpr,
    isAssign
  }),
  xorAssign: createToken("_=", {
    beforeExpr,
    isAssign
  }),
  moduloAssign: createToken("_=", {
    beforeExpr,
    isAssign
  }),
  incDec: createToken("++/--", {
    prefix,
    postfix,
    startsExpr
  }),
  bang: createToken("!", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  tilde: createToken("~", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  doubleCaret: createToken("^^", {
    startsExpr
  }),
  doubleAt: createToken("@@", {
    startsExpr
  }),
  pipeline: createBinop("|>", 0),
  nullishCoalescing: createBinop("??", 1),
  logicalOR: createBinop("||", 1),
  logicalAND: createBinop("&&", 2),
  bitwiseOR: createBinop("|", 3),
  bitwiseXOR: createBinop("^", 4),
  bitwiseAND: createBinop("&", 5),
  equality: createBinop("==/!=/===/!==", 6),
  lt: createBinop("</>/<=/>=", 7),
  gt: createBinop("</>/<=/>=", 7),
  relational: createBinop("</>/<=/>=", 7),
  bitShift: createBinop("<</>>/>>>", 8),
  bitShiftL: createBinop("<</>>/>>>", 8),
  bitShiftR: createBinop("<</>>/>>>", 8),
  plusMin: createToken("+/-", {
    beforeExpr,
    binop: 9,
    prefix,
    startsExpr
  }),
  modulo: createToken("%", {
    binop: 10,
    startsExpr
  }),
  star: createToken("*", {
    binop: 10
  }),
  slash: createBinop("/", 10),
  exponent: createToken("**", {
    beforeExpr,
    binop: 11,
    rightAssociative: true
  }),
  _in: createKeyword("in", {
    beforeExpr,
    binop: 7
  }),
  _instanceof: createKeyword("instanceof", {
    beforeExpr,
    binop: 7
  }),
  _break: createKeyword("break"),
  _case: createKeyword("case", {
    beforeExpr
  }),
  _catch: createKeyword("catch"),
  _continue: createKeyword("continue"),
  _debugger: createKeyword("debugger"),
  _default: createKeyword("default", {
    beforeExpr
  }),
  _else: createKeyword("else", {
    beforeExpr
  }),
  _finally: createKeyword("finally"),
  _function: createKeyword("function", {
    startsExpr
  }),
  _if: createKeyword("if"),
  _return: createKeyword("return", {
    beforeExpr
  }),
  _switch: createKeyword("switch"),
  _throw: createKeyword("throw", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  _try: createKeyword("try"),
  _var: createKeyword("var"),
  _const: createKeyword("const"),
  _with: createKeyword("with"),
  _new: createKeyword("new", {
    beforeExpr,
    startsExpr
  }),
  _this: createKeyword("this", {
    startsExpr
  }),
  _super: createKeyword("super", {
    startsExpr
  }),
  _class: createKeyword("class", {
    startsExpr
  }),
  _extends: createKeyword("extends", {
    beforeExpr
  }),
  _export: createKeyword("export"),
  _import: createKeyword("import", {
    startsExpr
  }),
  _null: createKeyword("null", {
    startsExpr
  }),
  _true: createKeyword("true", {
    startsExpr
  }),
  _false: createKeyword("false", {
    startsExpr
  }),
  _typeof: createKeyword("typeof", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  _void: createKeyword("void", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  _delete: createKeyword("delete", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  _do: createKeyword("do", {
    isLoop,
    beforeExpr
  }),
  _for: createKeyword("for", {
    isLoop
  }),
  _while: createKeyword("while", {
    isLoop
  }),
  _as: createKeywordLike("as", {
    startsExpr
  }),
  _assert: createKeywordLike("assert", {
    startsExpr
  }),
  _async: createKeywordLike("async", {
    startsExpr
  }),
  _await: createKeywordLike("await", {
    startsExpr
  }),
  _defer: createKeywordLike("defer", {
    startsExpr
  }),
  _from: createKeywordLike("from", {
    startsExpr
  }),
  _get: createKeywordLike("get", {
    startsExpr
  }),
  _let: createKeywordLike("let", {
    startsExpr
  }),
  _meta: createKeywordLike("meta", {
    startsExpr
  }),
  _of: createKeywordLike("of", {
    startsExpr
  }),
  _sent: createKeywordLike("sent", {
    startsExpr
  }),
  _set: createKeywordLike("set", {
    startsExpr
  }),
  _source: createKeywordLike("source", {
    startsExpr
  }),
  _static: createKeywordLike("static", {
    startsExpr
  }),
  _using: createKeywordLike("using", {
    startsExpr
  }),
  _yield: createKeywordLike("yield", {
    startsExpr
  }),
  _asserts: createKeywordLike("asserts", {
    startsExpr
  }),
  _checks: createKeywordLike("checks", {
    startsExpr
  }),
  _exports: createKeywordLike("exports", {
    startsExpr
  }),
  _global: createKeywordLike("global", {
    startsExpr
  }),
  _implements: createKeywordLike("implements", {
    startsExpr
  }),
  _intrinsic: createKeywordLike("intrinsic", {
    startsExpr
  }),
  _infer: createKeywordLike("infer", {
    startsExpr
  }),
  _is: createKeywordLike("is", {
    startsExpr
  }),
  _mixins: createKeywordLike("mixins", {
    startsExpr
  }),
  _proto: createKeywordLike("proto", {
    startsExpr
  }),
  _require: createKeywordLike("require", {
    startsExpr
  }),
  _satisfies: createKeywordLike("satisfies", {
    startsExpr
  }),
  _keyof: createKeywordLike("keyof", {
    startsExpr
  }),
  _readonly: createKeywordLike("readonly", {
    startsExpr
  }),
  _unique: createKeywordLike("unique", {
    startsExpr
  }),
  _abstract: createKeywordLike("abstract", {
    startsExpr
  }),
  _declare: createKeywordLike("declare", {
    startsExpr
  }),
  _enum: createKeywordLike("enum", {
    startsExpr
  }),
  _module: createKeywordLike("module", {
    startsExpr
  }),
  _namespace: createKeywordLike("namespace", {
    startsExpr
  }),
  _interface: createKeywordLike("interface", {
    startsExpr
  }),
  _type: createKeywordLike("type", {
    startsExpr
  }),
  _opaque: createKeywordLike("opaque", {
    startsExpr
  }),
  name: createToken("name", {
    startsExpr
  }),
  placeholder: createToken("%%", {
    startsExpr
  }),
  string: createToken("string", {
    startsExpr
  }),
  num: createToken("num", {
    startsExpr
  }),
  bigint: createToken("bigint", {
    startsExpr
  }),
  decimal: createToken("decimal", {
    startsExpr
  }),
  regexp: createToken("regexp", {
    startsExpr
  }),
  privateName: createToken("#name", {
    startsExpr
  }),
  eof: createToken("eof"),
  jsxName: createToken("jsxName"),
  jsxText: createToken("jsxText", {
    beforeExpr
  }),
  jsxTagStart: createToken("jsxTagStart", {
    startsExpr
  }),
  jsxTagEnd: createToken("jsxTagEnd")
};
function tokenIsIdentifier(token) {
  return token >= 93 && token <= 133;
}
function tokenKeywordOrIdentifierIsKeyword(token) {
  return token <= 92;
}
function tokenIsKeywordOrIdentifier(token) {
  return token >= 58 && token <= 133;
}
function tokenIsLiteralPropertyName(token) {
  return token >= 58 && token <= 137;
}
function tokenComesBeforeExpression(token) {
  return tokenBeforeExprs[token];
}
function tokenCanStartExpression(token) {
  return tokenStartsExprs[token];
}
function tokenIsAssignment(token) {
  return token >= 29 && token <= 33;
}
function tokenIsFlowInterfaceOrTypeOrOpaque(token) {
  return token >= 129 && token <= 131;
}
function tokenIsLoop(token) {
  return token >= 90 && token <= 92;
}
function tokenIsKeyword(token) {
  return token >= 58 && token <= 92;
}
function tokenIsOperator(token) {
  return token >= 39 && token <= 59;
}
function tokenIsPostfix(token) {
  return token === 34;
}
function tokenIsPrefix(token) {
  return tokenPrefixes[token];
}
function tokenIsTSTypeOperator(token) {
  return token >= 121 && token <= 123;
}
function tokenIsTSDeclarationStart(token) {
  return token >= 124 && token <= 130;
}
function tokenLabelName(token) {
  return tokenLabels[token];
}
function tokenOperatorPrecedence(token) {
  return tokenBinops[token];
}
function tokenIsRightAssociative(token) {
  return token === 57;
}
function tokenIsTemplate(token) {
  return token >= 24 && token <= 25;
}
function getExportedToken(token) {
  return tokenTypes[token];
}
tokenTypes[8].updateContext = context => {
  context.pop();
};
tokenTypes[5].updateContext = tokenTypes[7].updateContext = tokenTypes[23].updateContext = context => {
  context.push(types.brace);
};
tokenTypes[22].updateContext = context => {
  if (context[context.length - 1] === types.template) {
    context.pop();
  } else {
    context.push(types.template);
  }
};
tokenTypes[143].updateContext = context => {
  context.push(types.j_expr, types.j_oTag);
};
let nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u0870-\u0887\u0889-\u088f\u08a0-\u08c9\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c5c\u0c5d\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cdc-\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d04-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u1711\u171f-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4c\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c8a\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7dc\ua7f1-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab69\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
let nonASCIIidentifierChars = "\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u0897-\u089f\u08ca-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b55-\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3c\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0cf3\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d81-\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0ebc\u0ec8-\u0ece\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u180f-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1abf-\u1add\u1ae0-\u1aeb\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf4\u1cf7-\u1cf9\u1dc0-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\u30fb\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua82c\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f\uff65";
const nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
const nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;
const astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 13, 10, 2, 14, 2, 6, 2, 1, 2, 10, 2, 14, 2, 6, 2, 1, 4, 51, 13, 310, 10, 21, 11, 7, 25, 5, 2, 41, 2, 8, 70, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 7, 25, 39, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 39, 27, 10, 22, 251, 41, 7, 1, 17, 5, 57, 28, 11, 0, 9, 21, 43, 17, 47, 20, 28, 22, 13, 52, 58, 1, 3, 0, 14, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 20, 1, 64, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 31, 9, 2, 0, 3, 0, 2, 37, 2, 0, 26, 0, 2, 0, 45, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 38, 6, 186, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 19, 72, 200, 32, 32, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 24, 43, 261, 18, 16, 0, 2, 12, 2, 33, 125, 0, 80, 921, 103, 110, 18, 195, 2637, 96, 16, 1071, 18, 5, 26, 3994, 6, 582, 6842, 29, 1763, 568, 8, 30, 18, 78, 18, 29, 19, 47, 17, 3, 32, 20, 6, 18, 433, 44, 212, 63, 33, 24, 3, 24, 45, 74, 6, 0, 67, 12, 65, 1, 2, 0, 15, 4, 10, 7381, 42, 31, 98, 114, 8702, 3, 2, 6, 2, 1, 2, 290, 16, 0, 30, 2, 3, 0, 15, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 1845, 30, 7, 5, 262, 61, 147, 44, 11, 6, 17, 0, 322, 29, 19, 43, 485, 27, 229, 29, 3, 0, 208, 30, 2, 2, 2, 1, 2, 6, 3, 4, 10, 1, 225, 6, 2, 3, 2, 1, 2, 14, 2, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42719, 33, 4381, 3, 5773, 3, 7472, 16, 621, 2467, 541, 1507, 4938, 6, 8489];
const astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 7, 9, 32, 4, 318, 1, 78, 5, 71, 10, 50, 3, 123, 2, 54, 14, 32, 10, 3, 1, 11, 3, 46, 10, 8, 0, 46, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 3, 0, 158, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 68, 8, 2, 0, 3, 0, 2, 3, 2, 4, 2, 0, 15, 1, 83, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 7, 19, 58, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 199, 7, 137, 9, 54, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 55, 9, 266, 3, 10, 1, 2, 0, 49, 6, 4, 4, 14, 10, 5350, 0, 7, 14, 11465, 27, 2343, 9, 87, 9, 39, 4, 60, 6, 26, 9, 535, 9, 470, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 4178, 9, 519, 45, 3, 22, 543, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 101, 0, 161, 6, 10, 9, 357, 0, 62, 13, 499, 13, 245, 1, 2, 9, 233, 0, 3, 0, 8, 1, 6, 0, 475, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];
function isInAstralSet(code, set) {
  let pos = 0x10000;
  for (let i = 0, length = set.length; i < length; i += 2) {
    pos += set[i];
    if (pos > code) return false;
    pos += set[i + 1];
    if (pos >= code) return true;
  }
  return false;
}
function isIdentifierStart(code) {
  if (code < 65) return code === 36;
  if (code <= 90) return true;
  if (code < 97) return code === 95;
  if (code <= 122) return true;
  if (code <= 0xffff) {
    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  }
  return isInAstralSet(code, astralIdentifierStartCodes);
}
function isIdentifierChar(code) {
  if (code < 48) return code === 36;
  if (code < 58) return true;
  if (code < 65) return false;
  if (code <= 90) return true;
  if (code < 97) return code === 95;
  if (code <= 122) return true;
  if (code <= 0xffff) {
    return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  }
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}
const reservedWords = {
  keyword: ["break", "case", "catch", "continue", "debugger", "default", "do", "else", "finally", "for", "function", "if", "return", "switch", "throw", "try", "var", "const", "while", "with", "new", "this", "super", "class", "extends", "export", "import", "null", "true", "false", "in", "instanceof", "typeof", "void", "delete"],
  strict: ["implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"],
  strictBind: ["eval", "arguments"]
};
const keywords = new Set(reservedWords.keyword);
const reservedWordsStrictSet = new Set(reservedWords.strict);
const reservedWordsStrictBindSet = new Set(reservedWords.strictBind);
function isReservedWord(word, inModule) {
  return inModule && word === "await" || word === "enum";
}
function isStrictReservedWord(word, inModule) {
  return isReservedWord(word, inModule) || reservedWordsStrictSet.has(word);
}
function isStrictBindOnlyReservedWord(word) {
  return reservedWordsStrictBindSet.has(word);
}
function isStrictBindReservedWord(word, inModule) {
  return isStrictReservedWord(word, inModule) || isStrictBindOnlyReservedWord(word);
}
function isKeyword(word) {
  return keywords.has(word);
}
function isIteratorStart(current, next, next2) {
  return current === 64 && next === 64 && isIdentifierStart(next2);
}
const reservedWordLikeSet = new Set(["break", "case", "catch", "continue", "debugger", "default", "do", "else", "finally", "for", "function", "if", "return", "switch", "throw", "try", "var", "const", "while", "with", "new", "this", "super", "class", "extends", "export", "import", "null", "true", "false", "in", "instanceof", "typeof", "void", "delete", "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield", "eval", "arguments", "enum", "await"]);
function canBeReservedWord(word) {
  return reservedWordLikeSet.has(word);
}
class Scope {
  constructor(flags) {
    this.flags = 0;
    this.names = new Map();
    this.firstLexicalName = "";
    this.flags = flags;
  }
}
class ScopeHandler {
  constructor(parser, inModule) {
    this.parser = void 0;
    this.scopeStack = [];
    this.inModule = void 0;
    this.undefinedExports = new Map();
    this.parser = parser;
    this.inModule = inModule;
  }
  get inTopLevel() {
    return (this.currentScope().flags & 1) > 0;
  }
  get inFunction() {
    return (this.currentVarScopeFlags() & 2) > 0;
  }
  get allowSuper() {
    return (this.currentThisScopeFlags() & 16) > 0;
  }
  get allowDirectSuper() {
    return (this.currentThisScopeFlags() & 32) > 0;
  }
  get allowNewTarget() {
    return (this.currentThisScopeFlags() & 512) > 0;
  }
  get inClass() {
    return (this.currentThisScopeFlags() & 64) > 0;
  }
  get inClassAndNotInNonArrowFunction() {
    const flags = this.currentThisScopeFlags();
    return (flags & 64) > 0 && (flags & 2) === 0;
  }
  get inStaticBlock() {
    for (let i = this.scopeStack.length - 1;; i--) {
      const {
        flags
      } = this.scopeStack[i];
      if (flags & 128) {
        return true;
      }
      if (flags & (1667 | 64)) {
        return false;
      }
    }
  }
  get inNonArrowFunction() {
    return (this.currentThisScopeFlags() & 2) > 0;
  }
  get inBareCaseStatement() {
    return (this.currentScope().flags & 256) > 0;
  }
  get treatFunctionsAsVar() {
    return this.treatFunctionsAsVarInScope(this.currentScope());
  }
  createScope(flags) {
    return new Scope(flags);
  }
  enter(flags) {
    this.scopeStack.push(this.createScope(flags));
  }
  exit() {
    const scope = this.scopeStack.pop();
    return scope.flags;
  }
  treatFunctionsAsVarInScope(scope) {
    return !!(scope.flags & (2 | 128) || !this.parser.inModule && scope.flags & 1);
  }
  declareName(name, bindingType, loc) {
    let scope = this.currentScope();
    if (bindingType & 8 || bindingType & 16) {
      this.checkRedeclarationInScope(scope, name, bindingType, loc);
      let type = scope.names.get(name) || 0;
      if (bindingType & 16) {
        type = type | 4;
      } else {
        if (!scope.firstLexicalName) {
          scope.firstLexicalName = name;
        }
        type = type | 2;
      }
      scope.names.set(name, type);
      if (bindingType & 8) {
        this.maybeExportDefined(scope, name);
      }
    } else if (bindingType & 4) {
      for (let i = this.scopeStack.length - 1; i >= 0; --i) {
        scope = this.scopeStack[i];
        this.checkRedeclarationInScope(scope, name, bindingType, loc);
        scope.names.set(name, (scope.names.get(name) || 0) | 1);
        this.maybeExportDefined(scope, name);
        if (scope.flags & 1667) break;
      }
    }
    if (this.parser.inModule && scope.flags & 1) {
      this.undefinedExports.delete(name);
    }
  }
  maybeExportDefined(scope, name) {
    if (this.parser.inModule && scope.flags & 1) {
      this.undefinedExports.delete(name);
    }
  }
  checkRedeclarationInScope(scope, name, bindingType, loc) {
    if (this.isRedeclaredInScope(scope, name, bindingType)) {
      this.parser.raise(Errors.VarRedeclaration, loc, {
        identifierName: name
      });
    }
  }
  isRedeclaredInScope(scope, name, bindingType) {
    if (!(bindingType & 1)) return false;
    if (bindingType & 8) {
      return scope.names.has(name);
    }
    const type = scope.names.get(name) || 0;
    if (bindingType & 16) {
      return (type & 2) > 0 || !this.treatFunctionsAsVarInScope(scope) && (type & 1) > 0;
    }
    return (type & 2) > 0 && !(scope.flags & 8 && scope.firstLexicalName === name) || !this.treatFunctionsAsVarInScope(scope) && (type & 4) > 0;
  }
  checkLocalExport(id) {
    const {
      name
    } = id;
    const topLevelScope = this.scopeStack[0];
    if (!topLevelScope.names.has(name)) {
      this.undefinedExports.set(name, id.loc.start);
    }
  }
  currentScope() {
    return this.scopeStack[this.scopeStack.length - 1];
  }
  currentVarScopeFlags() {
    for (let i = this.scopeStack.length - 1;; i--) {
      const {
        flags
      } = this.scopeStack[i];
      if (flags & 1667) {
        return flags;
      }
    }
  }
  currentThisScopeFlags() {
    for (let i = this.scopeStack.length - 1;; i--) {
      const {
        flags
      } = this.scopeStack[i];
      if (flags & (1667 | 64) && !(flags & 4)) {
        return flags;
      }
    }
  }
}
class FlowScope extends Scope {
  constructor(...args) {
    super(...args);
    this.declareFunctions = new Set();
  }
}
class FlowScopeHandler extends ScopeHandler {
  createScope(flags) {
    return new FlowScope(flags);
  }
  declareName(name, bindingType, loc) {
    const scope = this.currentScope();
    if (bindingType & 2048) {
      this.checkRedeclarationInScope(scope, name, bindingType, loc);
      this.maybeExportDefined(scope, name);
      scope.declareFunctions.add(name);
      return;
    }
    super.declareName(name, bindingType, loc);
  }
  isRedeclaredInScope(scope, name, bindingType) {
    if (super.isRedeclaredInScope(scope, name, bindingType)) return true;
    if (bindingType & 2048 && !scope.declareFunctions.has(name)) {
      const type = scope.names.get(name);
      return (type & 4) > 0 || (type & 2) > 0;
    }
    return false;
  }
  checkLocalExport(id) {
    if (!this.scopeStack[0].declareFunctions.has(id.name)) {
      super.checkLocalExport(id);
    }
  }
}
const reservedTypes = new Set(["_", "any", "bool", "boolean", "empty", "extends", "false", "interface", "mixed", "null", "number", "static", "string", "true", "typeof", "void"]);
const FlowErrors = ParseErrorEnum`flow`({
  AmbiguousConditionalArrow: "Ambiguous expression: wrap the arrow functions in parentheses to disambiguate.",
  AmbiguousDeclareModuleKind: "Found both `declare module.exports` and `declare export` in the same module. Modules can only have 1 since they are either an ES module or they are a CommonJS module.",
  AssignReservedType: ({
    reservedType
  }) => `Cannot overwrite reserved type ${reservedType}.`,
  DeclareClassElement: "The `declare` modifier can only appear on class fields.",
  DeclareClassFieldInitializer: "Initializers are not allowed in fields with the `declare` modifier.",
  DuplicateDeclareModuleExports: "Duplicate `declare module.exports` statement.",
  EnumBooleanMemberNotInitialized: ({
    memberName,
    enumName
  }) => `Boolean enum members need to be initialized. Use either \`${memberName} = true,\` or \`${memberName} = false,\` in enum \`${enumName}\`.`,
  EnumDuplicateMemberName: ({
    memberName,
    enumName
  }) => `Enum member names need to be unique, but the name \`${memberName}\` has already been used before in enum \`${enumName}\`.`,
  EnumInconsistentMemberValues: ({
    enumName
  }) => `Enum \`${enumName}\` has inconsistent member initializers. Either use no initializers, or consistently use literals (either booleans, numbers, or strings) for all member initializers.`,
  EnumInvalidExplicitType: ({
    invalidEnumType,
    enumName
  }) => `Enum type \`${invalidEnumType}\` is not valid. Use one of \`boolean\`, \`number\`, \`string\`, or \`symbol\` in enum \`${enumName}\`.`,
  EnumInvalidExplicitTypeUnknownSupplied: ({
    enumName
  }) => `Supplied enum type is not valid. Use one of \`boolean\`, \`number\`, \`string\`, or \`symbol\` in enum \`${enumName}\`.`,
  EnumInvalidMemberInitializerPrimaryType: ({
    enumName,
    memberName,
    explicitType
  }) => `Enum \`${enumName}\` has type \`${explicitType}\`, so the initializer of \`${memberName}\` needs to be a ${explicitType} literal.`,
  EnumInvalidMemberInitializerSymbolType: ({
    enumName,
    memberName
  }) => `Symbol enum members cannot be initialized. Use \`${memberName},\` in enum \`${enumName}\`.`,
  EnumInvalidMemberInitializerUnknownType: ({
    enumName,
    memberName
  }) => `The enum member initializer for \`${memberName}\` needs to be a literal (either a boolean, number, or string) in enum \`${enumName}\`.`,
  EnumInvalidMemberName: ({
    enumName,
    memberName,
    suggestion
  }) => `Enum member names cannot start with lowercase 'a' through 'z'. Instead of using \`${memberName}\`, consider using \`${suggestion}\`, in enum \`${enumName}\`.`,
  EnumNumberMemberNotInitialized: ({
    enumName,
    memberName
  }) => `Number enum members need to be initialized, e.g. \`${memberName} = 1\` in enum \`${enumName}\`.`,
  EnumStringMemberInconsistentlyInitialized: ({
    enumName
  }) => `String enum members need to consistently either all use initializers, or use no initializers, in enum \`${enumName}\`.`,
  GetterMayNotHaveThisParam: "A getter cannot have a `this` parameter.",
  ImportReflectionHasImportType: "An `import module` declaration can not use `type` or `typeof` keyword.",
  ImportTypeShorthandOnlyInPureImport: "The `type` and `typeof` keywords on named imports can only be used on regular `import` statements. It cannot be used with `import type` or `import typeof` statements.",
  InexactInsideExact: "Explicit inexact syntax cannot appear inside an explicit exact object type.",
  InexactInsideNonObject: "Explicit inexact syntax cannot appear in class or interface definitions.",
  InexactVariance: "Explicit inexact syntax cannot have variance.",
  InvalidNonTypeImportInDeclareModule: "Imports within a `declare module` body must always be `import type` or `import typeof`.",
  MissingTypeParamDefault: "Type parameter declaration needs a default, since a preceding type parameter declaration has a default.",
  NestedDeclareModule: "`declare module` cannot be used inside another `declare module`.",
  NestedFlowComment: "Cannot have a flow comment inside another flow comment.",
  PatternIsOptional: Object.assign({
    message: "A binding pattern parameter cannot be optional in an implementation signature."
  }, {
    reasonCode: "OptionalBindingPattern"
  }),
  SetterMayNotHaveThisParam: "A setter cannot have a `this` parameter.",
  SpreadVariance: "Spread properties cannot have variance.",
  ThisParamAnnotationRequired: "A type annotation is required for the `this` parameter.",
  ThisParamBannedInConstructor: "Constructors cannot have a `this` parameter; constructors don't bind `this` like other functions.",
  ThisParamMayNotBeOptional: "The `this` parameter cannot be optional.",
  ThisParamMustBeFirst: "The `this` parameter must be the first function parameter.",
  ThisParamNoDefault: "The `this` parameter may not have a default value.",
  TypeBeforeInitializer: "Type annotations must come before default assignments, e.g. instead of `age = 25: number` use `age: number = 25`.",
  TypeCastInPattern: "The type cast expression is expected to be wrapped with parenthesis.",
  UnexpectedExplicitInexactInObject: "Explicit inexact syntax must appear at the end of an inexact object.",
  UnexpectedReservedType: ({
    reservedType
  }) => `Unexpected reserved type ${reservedType}.`,
  UnexpectedReservedUnderscore: "`_` is only allowed as a type argument to call or new.",
  UnexpectedSpaceBetweenModuloChecks: "Spaces between `%` and `checks` are not allowed here.",
  UnexpectedSpreadType: "Spread operator cannot appear in class or interface definitions.",
  UnexpectedSubtractionOperand: 'Unexpected token, expected "number" or "bigint".',
  UnexpectedTokenAfterTypeParameter: "Expected an arrow function after this type parameter declaration.",
  UnexpectedTypeParameterBeforeAsyncArrowFunction: "Type parameters must come after the async keyword, e.g. instead of `<T> async () => {}`, use `async <T>() => {}`.",
  UnsupportedDeclareExportKind: ({
    unsupportedExportKind,
    suggestion
  }) => `\`declare export ${unsupportedExportKind}\` is not supported. Use \`${suggestion}\` instead.`,
  UnsupportedStatementInDeclareModule: "Only declares and type imports are allowed inside declare module.",
  UnterminatedFlowComment: "Unterminated flow-comment."
});
function isEsModuleType(bodyElement) {
  return bodyElement.type === "DeclareExportAllDeclaration" || bodyElement.type === "DeclareExportDeclaration" && (!bodyElement.declaration || bodyElement.declaration.type !== "TypeAlias" && bodyElement.declaration.type !== "InterfaceDeclaration");
}
function hasTypeImportKind(node) {
  return node.importKind === "type" || node.importKind === "typeof";
}
const exportSuggestions = {
  const: "declare export var",
  let: "declare export var",
  type: "export type",
  interface: "export interface"
};
function partition(list, test) {
  const list1 = [];
  const list2 = [];
  for (let i = 0; i < list.length; i++) {
    (test(list[i], i, list) ? list1 : list2).push(list[i]);
  }
  return [list1, list2];
}
const FLOW_PRAGMA_REGEX = /\*?\s*@((?:no)?flow)\b/;
var flow = superClass => class FlowParserMixin extends superClass {
  constructor(...args) {
    super(...args);
    this.flowPragma = undefined;
  }
  getScopeHandler() {
    return FlowScopeHandler;
  }
  shouldParseTypes() {
    return this.getPluginOption("flow", "all") || this.flowPragma === "flow";
  }
  finishToken(type, val) {
    if (type !== 134 && type !== 13 && type !== 28) {
      if (this.flowPragma === undefined) {
        this.flowPragma = null;
      }
    }
    super.finishToken(type, val);
  }
  addComment(comment) {
    if (this.flowPragma === undefined) {
      const matches = FLOW_PRAGMA_REGEX.exec(comment.value);
      if (!matches) ;else if (matches[1] === "flow") {
        this.flowPragma = "flow";
      } else if (matches[1] === "noflow") {
        this.flowPragma = "noflow";
      } else {
        throw new Error("Unexpected flow pragma");
      }
    }
    super.addComment(comment);
  }
  flowParseTypeInitialiser(tok) {
    const oldInType = this.state.inType;
    this.state.inType = true;
    this.expect(tok || 14);
    const type = this.flowParseType();
    this.state.inType = oldInType;
    return type;
  }
  flowParsePredicate() {
    const node = this.startNode();
    const moduloLoc = this.state.startLoc;
    this.next();
    this.expectContextual(110);
    if (this.state.lastTokStartLoc.index > moduloLoc.index + 1) {
      this.raise(FlowErrors.UnexpectedSpaceBetweenModuloChecks, moduloLoc);
    }
    if (this.eat(10)) {
      node.value = super.parseExpression();
      this.expect(11);
      return this.finishNode(node, "DeclaredPredicate");
    } else {
      return this.finishNode(node, "InferredPredicate");
    }
  }
  flowParseTypeAndPredicateInitialiser() {
    const oldInType = this.state.inType;
    this.state.inType = true;
    this.expect(14);
    let type = null;
    let predicate = null;
    if (this.match(54)) {
      this.state.inType = oldInType;
      predicate = this.flowParsePredicate();
    } else {
      type = this.flowParseType();
      this.state.inType = oldInType;
      if (this.match(54)) {
        predicate = this.flowParsePredicate();
      }
    }
    return [type, predicate];
  }
  flowParseDeclareClass(node) {
    this.next();
    this.flowParseInterfaceish(node, true);
    return this.finishNode(node, "DeclareClass");
  }
  flowParseDeclareFunction(node) {
    this.next();
    const id = node.id = this.parseIdentifier();
    const typeNode = this.startNode();
    const typeContainer = this.startNode();
    if (this.match(47)) {
      typeNode.typeParameters = this.flowParseTypeParameterDeclaration();
    } else {
      typeNode.typeParameters = null;
    }
    this.expect(10);
    const tmp = this.flowParseFunctionTypeParams();
    typeNode.params = tmp.params;
    typeNode.rest = tmp.rest;
    typeNode.this = tmp._this;
    this.expect(11);
    [typeNode.returnType, node.predicate] = this.flowParseTypeAndPredicateInitialiser();
    typeContainer.typeAnnotation = this.finishNode(typeNode, "FunctionTypeAnnotation");
    id.typeAnnotation = this.finishNode(typeContainer, "TypeAnnotation");
    this.resetEndLocation(id);
    this.semicolon();
    this.scope.declareName(node.id.name, 2048, node.id.loc.start);
    return this.finishNode(node, "DeclareFunction");
  }
  flowParseDeclare(node, insideModule) {
    if (this.match(80)) {
      return this.flowParseDeclareClass(node);
    } else if (this.match(68)) {
      return this.flowParseDeclareFunction(node);
    } else if (this.match(74)) {
      return this.flowParseDeclareVariable(node);
    } else if (this.eatContextual(127)) {
      if (this.match(16)) {
        return this.flowParseDeclareModuleExports(node);
      } else {
        if (insideModule) {
          this.raise(FlowErrors.NestedDeclareModule, this.state.lastTokStartLoc);
        }
        return this.flowParseDeclareModule(node);
      }
    } else if (this.isContextual(130)) {
      return this.flowParseDeclareTypeAlias(node);
    } else if (this.isContextual(131)) {
      return this.flowParseDeclareOpaqueType(node);
    } else if (this.isContextual(129)) {
      return this.flowParseDeclareInterface(node);
    } else if (this.match(82)) {
      return this.flowParseDeclareExportDeclaration(node, insideModule);
    }
    throw this.unexpected();
  }
  flowParseDeclareVariable(node) {
    this.next();
    node.id = this.flowParseTypeAnnotatableIdentifier();
    this.scope.declareName(node.id.name, 5, node.id.loc.start);
    this.semicolon();
    return this.finishNode(node, "DeclareVariable");
  }
  flowParseDeclareModule(node) {
    this.scope.enter(0);
    if (this.match(134)) {
      node.id = super.parseExprAtom();
    } else {
      node.id = this.parseIdentifier();
    }
    const bodyNode = node.body = this.startNode();
    const body = bodyNode.body = [];
    this.expect(5);
    while (!this.match(8)) {
      const bodyNode = this.startNode();
      if (this.match(83)) {
        this.next();
        if (!this.isContextual(130) && !this.match(87)) {
          this.raise(FlowErrors.InvalidNonTypeImportInDeclareModule, this.state.lastTokStartLoc);
        }
        body.push(super.parseImport(bodyNode));
      } else {
        this.expectContextual(125, FlowErrors.UnsupportedStatementInDeclareModule);
        body.push(this.flowParseDeclare(bodyNode, true));
      }
    }
    this.scope.exit();
    this.expect(8);
    this.finishNode(bodyNode, "BlockStatement");
    let kind = null;
    let hasModuleExport = false;
    body.forEach(bodyElement => {
      if (isEsModuleType(bodyElement)) {
        if (kind === "CommonJS") {
          this.raise(FlowErrors.AmbiguousDeclareModuleKind, bodyElement);
        }
        kind = "ES";
      } else if (bodyElement.type === "DeclareModuleExports") {
        if (hasModuleExport) {
          this.raise(FlowErrors.DuplicateDeclareModuleExports, bodyElement);
        }
        if (kind === "ES") {
          this.raise(FlowErrors.AmbiguousDeclareModuleKind, bodyElement);
        }
        kind = "CommonJS";
        hasModuleExport = true;
      }
    });
    node.kind = kind || "CommonJS";
    return this.finishNode(node, "DeclareModule");
  }
  flowParseDeclareExportDeclaration(node, insideModule) {
    this.expect(82);
    if (this.eat(65)) {
      if (this.match(68) || this.match(80)) {
        node.declaration = this.flowParseDeclare(this.startNode());
      } else {
        node.declaration = this.flowParseType();
        this.semicolon();
      }
      node.default = true;
      return this.finishNode(node, "DeclareExportDeclaration");
    } else {
      if (this.match(75) || this.isLet() || (this.isContextual(130) || this.isContextual(129)) && !insideModule) {
        const label = this.state.value;
        throw this.raise(FlowErrors.UnsupportedDeclareExportKind, this.state.startLoc, {
          unsupportedExportKind: label,
          suggestion: exportSuggestions[label]
        });
      }
      if (this.match(74) || this.match(68) || this.match(80) || this.isContextual(131)) {
        node.declaration = this.flowParseDeclare(this.startNode());
        node.default = false;
        return this.finishNode(node, "DeclareExportDeclaration");
      } else if (this.match(55) || this.match(5) || this.isContextual(129) || this.isContextual(130) || this.isContextual(131)) {
        node = this.parseExport(node, null);
        if (node.type === "ExportNamedDeclaration") {
          node.default = false;
          delete node.exportKind;
          return this.castNodeTo(node, "DeclareExportDeclaration");
        } else {
          return this.castNodeTo(node, "DeclareExportAllDeclaration");
        }
      }
    }
    throw this.unexpected();
  }
  flowParseDeclareModuleExports(node) {
    this.next();
    this.expectContextual(111);
    node.typeAnnotation = this.flowParseTypeAnnotation();
    this.semicolon();
    return this.finishNode(node, "DeclareModuleExports");
  }
  flowParseDeclareTypeAlias(node) {
    this.next();
    const finished = this.flowParseTypeAlias(node);
    this.castNodeTo(finished, "DeclareTypeAlias");
    return finished;
  }
  flowParseDeclareOpaqueType(node) {
    this.next();
    const finished = this.flowParseOpaqueType(node, true);
    this.castNodeTo(finished, "DeclareOpaqueType");
    return finished;
  }
  flowParseDeclareInterface(node) {
    this.next();
    this.flowParseInterfaceish(node, false);
    return this.finishNode(node, "DeclareInterface");
  }
  flowParseInterfaceish(node, isClass) {
    node.id = this.flowParseRestrictedIdentifier(!isClass, true);
    this.scope.declareName(node.id.name, isClass ? 17 : 8201, node.id.loc.start);
    if (this.match(47)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    } else {
      node.typeParameters = null;
    }
    node.extends = [];
    if (this.eat(81)) {
      do {
        node.extends.push(this.flowParseInterfaceExtends());
      } while (!isClass && this.eat(12));
    }
    if (isClass) {
      node.implements = [];
      node.mixins = [];
      if (this.eatContextual(117)) {
        do {
          node.mixins.push(this.flowParseInterfaceExtends());
        } while (this.eat(12));
      }
      if (this.eatContextual(113)) {
        do {
          node.implements.push(this.flowParseInterfaceExtends());
        } while (this.eat(12));
      }
    }
    node.body = this.flowParseObjectType({
      allowStatic: isClass,
      allowExact: false,
      allowSpread: false,
      allowProto: isClass,
      allowInexact: false
    });
  }
  flowParseInterfaceExtends() {
    const node = this.startNode();
    node.id = this.flowParseQualifiedTypeIdentifier();
    if (this.match(47)) {
      node.typeParameters = this.flowParseTypeParameterInstantiation();
    } else {
      node.typeParameters = null;
    }
    return this.finishNode(node, "InterfaceExtends");
  }
  flowParseInterface(node) {
    this.flowParseInterfaceish(node, false);
    return this.finishNode(node, "InterfaceDeclaration");
  }
  checkNotUnderscore(word) {
    if (word === "_") {
      this.raise(FlowErrors.UnexpectedReservedUnderscore, this.state.startLoc);
    }
  }
  checkReservedType(word, startLoc, declaration) {
    if (!reservedTypes.has(word)) return;
    this.raise(declaration ? FlowErrors.AssignReservedType : FlowErrors.UnexpectedReservedType, startLoc, {
      reservedType: word
    });
  }
  flowParseRestrictedIdentifierName(liberal, declaration) {
    this.checkReservedType(this.state.value, this.state.startLoc, declaration);
    return this.parseIdentifierName(liberal);
  }
  flowParseRestrictedIdentifier(liberal, declaration) {
    const node = this.startNode();
    const name = this.flowParseRestrictedIdentifierName(liberal, declaration);
    return this.createIdentifier(node, name);
  }
  flowParseTypeAlias(node) {
    node.id = this.flowParseRestrictedIdentifier(false, true);
    this.scope.declareName(node.id.name, 8201, node.id.loc.start);
    if (this.match(47)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    } else {
      node.typeParameters = null;
    }
    node.right = this.flowParseTypeInitialiser(29);
    this.semicolon();
    return this.finishNode(node, "TypeAlias");
  }
  flowParseOpaqueType(node, declare) {
    this.expectContextual(130);
    node.id = this.flowParseRestrictedIdentifier(true, true);
    this.scope.declareName(node.id.name, 8201, node.id.loc.start);
    if (this.match(47)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    } else {
      node.typeParameters = null;
    }
    node.supertype = null;
    if (this.match(14)) {
      node.supertype = this.flowParseTypeInitialiser(14);
    }
    node.impltype = null;
    if (!declare) {
      node.impltype = this.flowParseTypeInitialiser(29);
    }
    this.semicolon();
    return this.finishNode(node, "OpaqueType");
  }
  flowParseTypeParameterBound() {
    if (this.match(14) || this.isContextual(81)) {
      const node = this.startNode();
      this.next();
      node.typeAnnotation = this.flowParseType();
      return this.finishNode(node, "TypeAnnotation");
    }
  }
  flowParseTypeParameter(requireDefault = false) {
    const nodeStartLoc = this.state.startLoc;
    const node = this.startNode();
    const variance = this.flowParseVariance();
    node.name = this.flowParseRestrictedIdentifierName();
    node.variance = variance;
    node.bound = this.flowParseTypeParameterBound();
    if (this.match(29)) {
      this.eat(29);
      node.default = this.flowParseType();
    } else {
      if (requireDefault) {
        this.raise(FlowErrors.MissingTypeParamDefault, nodeStartLoc);
      }
    }
    return this.finishNode(node, "TypeParameter");
  }
  flowParseTypeParameterDeclaration() {
    const oldInType = this.state.inType;
    const node = this.startNode();
    node.params = [];
    this.state.inType = true;
    if (this.match(47) || this.match(143)) {
      this.next();
    } else {
      this.unexpected();
    }
    let defaultRequired = false;
    do {
      const typeParameter = this.flowParseTypeParameter(defaultRequired);
      node.params.push(typeParameter);
      if (typeParameter.default) {
        defaultRequired = true;
      }
      if (!this.match(48)) {
        this.expect(12);
      }
    } while (!this.match(48));
    this.expect(48);
    this.state.inType = oldInType;
    return this.finishNode(node, "TypeParameterDeclaration");
  }
  flowInTopLevelContext(cb) {
    if (this.curContext() !== types.brace) {
      const oldContext = this.state.context;
      this.state.context = [oldContext[0]];
      try {
        return cb();
      } finally {
        this.state.context = oldContext;
      }
    } else {
      return cb();
    }
  }
  flowParseTypeParameterInstantiationInExpression() {
    if (this.reScan_lt() !== 47) return;
    return this.flowParseTypeParameterInstantiation();
  }
  flowParseTypeParameterInstantiation() {
    const node = this.startNode();
    const oldInType = this.state.inType;
    this.state.inType = true;
    node.params = [];
    this.flowInTopLevelContext(() => {
      this.expect(47);
      const oldNoAnonFunctionType = this.state.noAnonFunctionType;
      this.state.noAnonFunctionType = false;
      while (!this.match(48)) {
        node.params.push(this.flowParseType());
        if (!this.match(48)) {
          this.expect(12);
        }
      }
      this.state.noAnonFunctionType = oldNoAnonFunctionType;
    });
    this.state.inType = oldInType;
    if (!this.state.inType && this.curContext() === types.brace) {
      this.reScan_lt_gt();
    }
    this.expect(48);
    return this.finishNode(node, "TypeParameterInstantiation");
  }
  flowParseTypeParameterInstantiationCallOrNew() {
    if (this.reScan_lt() !== 47) return null;
    const node = this.startNode();
    const oldInType = this.state.inType;
    node.params = [];
    this.state.inType = true;
    this.expect(47);
    while (!this.match(48)) {
      node.params.push(this.flowParseTypeOrImplicitInstantiation());
      if (!this.match(48)) {
        this.expect(12);
      }
    }
    this.expect(48);
    this.state.inType = oldInType;
    return this.finishNode(node, "TypeParameterInstantiation");
  }
  flowParseInterfaceType() {
    const node = this.startNode();
    this.expectContextual(129);
    node.extends = [];
    if (this.eat(81)) {
      do {
        node.extends.push(this.flowParseInterfaceExtends());
      } while (this.eat(12));
    }
    node.body = this.flowParseObjectType({
      allowStatic: false,
      allowExact: false,
      allowSpread: false,
      allowProto: false,
      allowInexact: false
    });
    return this.finishNode(node, "InterfaceTypeAnnotation");
  }
  flowParseObjectPropertyKey() {
    return this.match(135) || this.match(134) ? super.parseExprAtom() : this.parseIdentifier(true);
  }
  flowParseObjectTypeIndexer(node, isStatic, variance) {
    node.static = isStatic;
    if (this.lookahead().type === 14) {
      node.id = this.flowParseObjectPropertyKey();
      node.key = this.flowParseTypeInitialiser();
    } else {
      node.id = null;
      node.key = this.flowParseType();
    }
    this.expect(3);
    node.value = this.flowParseTypeInitialiser();
    node.variance = variance;
    return this.finishNode(node, "ObjectTypeIndexer");
  }
  flowParseObjectTypeInternalSlot(node, isStatic) {
    node.static = isStatic;
    node.id = this.flowParseObjectPropertyKey();
    this.expect(3);
    this.expect(3);
    if (this.match(47) || this.match(10)) {
      node.method = true;
      node.optional = false;
      node.value = this.flowParseObjectTypeMethodish(this.startNodeAt(node.loc.start));
    } else {
      node.method = false;
      if (this.eat(17)) {
        node.optional = true;
      }
      node.value = this.flowParseTypeInitialiser();
    }
    return this.finishNode(node, "ObjectTypeInternalSlot");
  }
  flowParseObjectTypeMethodish(node) {
    node.params = [];
    node.rest = null;
    node.typeParameters = null;
    node.this = null;
    if (this.match(47)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    }
    this.expect(10);
    if (this.match(78)) {
      node.this = this.flowParseFunctionTypeParam(true);
      node.this.name = null;
      if (!this.match(11)) {
        this.expect(12);
      }
    }
    while (!this.match(11) && !this.match(21)) {
      node.params.push(this.flowParseFunctionTypeParam(false));
      if (!this.match(11)) {
        this.expect(12);
      }
    }
    if (this.eat(21)) {
      node.rest = this.flowParseFunctionTypeParam(false);
    }
    this.expect(11);
    node.returnType = this.flowParseTypeInitialiser();
    return this.finishNode(node, "FunctionTypeAnnotation");
  }
  flowParseObjectTypeCallProperty(node, isStatic) {
    const valueNode = this.startNode();
    node.static = isStatic;
    node.value = this.flowParseObjectTypeMethodish(valueNode);
    return this.finishNode(node, "ObjectTypeCallProperty");
  }
  flowParseObjectType({
    allowStatic,
    allowExact,
    allowSpread,
    allowProto,
    allowInexact
  }) {
    const oldInType = this.state.inType;
    this.state.inType = true;
    const nodeStart = this.startNode();
    nodeStart.callProperties = [];
    nodeStart.properties = [];
    nodeStart.indexers = [];
    nodeStart.internalSlots = [];
    let endDelim;
    let exact;
    let inexact = false;
    if (allowExact && this.match(6)) {
      this.expect(6);
      endDelim = 9;
      exact = true;
    } else {
      this.expect(5);
      endDelim = 8;
      exact = false;
    }
    nodeStart.exact = exact;
    while (!this.match(endDelim)) {
      let isStatic = false;
      let protoStartLoc = null;
      let inexactStartLoc = null;
      const node = this.startNode();
      if (allowProto && this.isContextual(118)) {
        const lookahead = this.lookahead();
        if (lookahead.type !== 14 && lookahead.type !== 17) {
          this.next();
          protoStartLoc = this.state.startLoc;
          allowStatic = false;
        }
      }
      if (allowStatic && this.isContextual(106)) {
        const lookahead = this.lookahead();
        if (lookahead.type !== 14 && lookahead.type !== 17) {
          this.next();
          isStatic = true;
        }
      }
      const variance = this.flowParseVariance();
      if (this.eat(0)) {
        if (protoStartLoc != null) {
          this.unexpected(protoStartLoc);
        }
        if (this.eat(0)) {
          if (variance) {
            this.unexpected(variance.loc.start);
          }
          nodeStart.internalSlots.push(this.flowParseObjectTypeInternalSlot(node, isStatic));
        } else {
          nodeStart.indexers.push(this.flowParseObjectTypeIndexer(node, isStatic, variance));
        }
      } else if (this.match(10) || this.match(47)) {
        if (protoStartLoc != null) {
          this.unexpected(protoStartLoc);
        }
        if (variance) {
          this.unexpected(variance.loc.start);
        }
        nodeStart.callProperties.push(this.flowParseObjectTypeCallProperty(node, isStatic));
      } else {
        let kind = "init";
        if (this.isContextual(99) || this.isContextual(104)) {
          const lookahead = this.lookahead();
          if (tokenIsLiteralPropertyName(lookahead.type)) {
            kind = this.state.value;
            this.next();
          }
        }
        const propOrInexact = this.flowParseObjectTypeProperty(node, isStatic, protoStartLoc, variance, kind, allowSpread, allowInexact != null ? allowInexact : !exact);
        if (propOrInexact === null) {
          inexact = true;
          inexactStartLoc = this.state.lastTokStartLoc;
        } else {
          nodeStart.properties.push(propOrInexact);
        }
      }
      this.flowObjectTypeSemicolon();
      if (inexactStartLoc && !this.match(8) && !this.match(9)) {
        this.raise(FlowErrors.UnexpectedExplicitInexactInObject, inexactStartLoc);
      }
    }
    this.expect(endDelim);
    if (allowSpread) {
      nodeStart.inexact = inexact;
    }
    const out = this.finishNode(nodeStart, "ObjectTypeAnnotation");
    this.state.inType = oldInType;
    return out;
  }
  flowParseObjectTypeProperty(node, isStatic, protoStartLoc, variance, kind, allowSpread, allowInexact) {
    if (this.eat(21)) {
      const isInexactToken = this.match(12) || this.match(13) || this.match(8) || this.match(9);
      if (isInexactToken) {
        if (!allowSpread) {
          this.raise(FlowErrors.InexactInsideNonObject, this.state.lastTokStartLoc);
        } else if (!allowInexact) {
          this.raise(FlowErrors.InexactInsideExact, this.state.lastTokStartLoc);
        }
        if (variance) {
          this.raise(FlowErrors.InexactVariance, variance);
        }
        return null;
      }
      if (!allowSpread) {
        this.raise(FlowErrors.UnexpectedSpreadType, this.state.lastTokStartLoc);
      }
      if (protoStartLoc != null) {
        this.unexpected(protoStartLoc);
      }
      if (variance) {
        this.raise(FlowErrors.SpreadVariance, variance);
      }
      node.argument = this.flowParseType();
      return this.finishNode(node, "ObjectTypeSpreadProperty");
    } else {
      node.key = this.flowParseObjectPropertyKey();
      node.static = isStatic;
      node.proto = protoStartLoc != null;
      node.kind = kind;
      let optional = false;
      if (this.match(47) || this.match(10)) {
        node.method = true;
        if (protoStartLoc != null) {
          this.unexpected(protoStartLoc);
        }
        if (variance) {
          this.unexpected(variance.loc.start);
        }
        node.value = this.flowParseObjectTypeMethodish(this.startNodeAt(node.loc.start));
        if (kind === "get" || kind === "set") {
          this.flowCheckGetterSetterParams(node);
        }
        if (!allowSpread && node.key.name === "constructor" && node.value.this) {
          this.raise(FlowErrors.ThisParamBannedInConstructor, node.value.this);
        }
      } else {
        if (kind !== "init") this.unexpected();
        node.method = false;
        if (this.eat(17)) {
          optional = true;
        }
        node.value = this.flowParseTypeInitialiser();
        node.variance = variance;
      }
      node.optional = optional;
      return this.finishNode(node, "ObjectTypeProperty");
    }
  }
  flowCheckGetterSetterParams(property) {
    const paramCount = property.kind === "get" ? 0 : 1;
    const length = property.value.params.length + (property.value.rest ? 1 : 0);
    if (property.value.this) {
      this.raise(property.kind === "get" ? FlowErrors.GetterMayNotHaveThisParam : FlowErrors.SetterMayNotHaveThisParam, property.value.this);
    }
    if (length !== paramCount) {
      this.raise(property.kind === "get" ? Errors.BadGetterArity : Errors.BadSetterArity, property);
    }
    if (property.kind === "set" && property.value.rest) {
      this.raise(Errors.BadSetterRestParameter, property);
    }
  }
  flowObjectTypeSemicolon() {
    if (!this.eat(13) && !this.eat(12) && !this.match(8) && !this.match(9)) {
      this.unexpected();
    }
  }
  flowParseQualifiedTypeIdentifier(startLoc, id) {
    startLoc != null ? startLoc : startLoc = this.state.startLoc;
    let node = id || this.flowParseRestrictedIdentifier(true);
    while (this.eat(16)) {
      const node2 = this.startNodeAt(startLoc);
      node2.qualification = node;
      node2.id = this.flowParseRestrictedIdentifier(true);
      node = this.finishNode(node2, "QualifiedTypeIdentifier");
    }
    return node;
  }
  flowParseGenericType(startLoc, id) {
    const node = this.startNodeAt(startLoc);
    node.typeParameters = null;
    node.id = this.flowParseQualifiedTypeIdentifier(startLoc, id);
    if (this.match(47)) {
      node.typeParameters = this.flowParseTypeParameterInstantiation();
    }
    return this.finishNode(node, "GenericTypeAnnotation");
  }
  flowParseTypeofType() {
    const node = this.startNode();
    this.expect(87);
    node.argument = this.flowParsePrimaryType();
    return this.finishNode(node, "TypeofTypeAnnotation");
  }
  flowParseTupleType() {
    const node = this.startNode();
    node.types = [];
    this.expect(0);
    while (this.state.pos < this.length && !this.match(3)) {
      node.types.push(this.flowParseType());
      if (this.match(3)) break;
      this.expect(12);
    }
    this.expect(3);
    return this.finishNode(node, "TupleTypeAnnotation");
  }
  flowParseFunctionTypeParam(first) {
    let name = null;
    let optional = false;
    let typeAnnotation = null;
    const node = this.startNode();
    const lh = this.lookahead();
    const isThis = this.state.type === 78;
    if (lh.type === 14 || lh.type === 17) {
      if (isThis && !first) {
        this.raise(FlowErrors.ThisParamMustBeFirst, node);
      }
      name = this.parseIdentifier(isThis);
      if (this.eat(17)) {
        optional = true;
        if (isThis) {
          this.raise(FlowErrors.ThisParamMayNotBeOptional, node);
        }
      }
      typeAnnotation = this.flowParseTypeInitialiser();
    } else {
      typeAnnotation = this.flowParseType();
    }
    node.name = name;
    node.optional = optional;
    node.typeAnnotation = typeAnnotation;
    return this.finishNode(node, "FunctionTypeParam");
  }
  reinterpretTypeAsFunctionTypeParam(type) {
    const node = this.startNodeAt(type.loc.start);
    node.name = null;
    node.optional = false;
    node.typeAnnotation = type;
    return this.finishNode(node, "FunctionTypeParam");
  }
  flowParseFunctionTypeParams(params = []) {
    let rest = null;
    let _this = null;
    if (this.match(78)) {
      _this = this.flowParseFunctionTypeParam(true);
      _this.name = null;
      if (!this.match(11)) {
        this.expect(12);
      }
    }
    while (!this.match(11) && !this.match(21)) {
      params.push(this.flowParseFunctionTypeParam(false));
      if (!this.match(11)) {
        this.expect(12);
      }
    }
    if (this.eat(21)) {
      rest = this.flowParseFunctionTypeParam(false);
    }
    return {
      params,
      rest,
      _this
    };
  }
  flowIdentToTypeAnnotation(startLoc, node, id) {
    switch (id.name) {
      case "any":
        return this.finishNode(node, "AnyTypeAnnotation");
      case "bool":
      case "boolean":
        return this.finishNode(node, "BooleanTypeAnnotation");
      case "mixed":
        return this.finishNode(node, "MixedTypeAnnotation");
      case "empty":
        return this.finishNode(node, "EmptyTypeAnnotation");
      case "number":
        return this.finishNode(node, "NumberTypeAnnotation");
      case "string":
        return this.finishNode(node, "StringTypeAnnotation");
      case "symbol":
        return this.finishNode(node, "SymbolTypeAnnotation");
      default:
        this.checkNotUnderscore(id.name);
        return this.flowParseGenericType(startLoc, id);
    }
  }
  flowParsePrimaryType() {
    const startLoc = this.state.startLoc;
    const node = this.startNode();
    let tmp;
    let type;
    let isGroupedType = false;
    const oldNoAnonFunctionType = this.state.noAnonFunctionType;
    switch (this.state.type) {
      case 5:
        return this.flowParseObjectType({
          allowStatic: false,
          allowExact: false,
          allowSpread: true,
          allowProto: false,
          allowInexact: true
        });
      case 6:
        return this.flowParseObjectType({
          allowStatic: false,
          allowExact: true,
          allowSpread: true,
          allowProto: false,
          allowInexact: false
        });
      case 0:
        this.state.noAnonFunctionType = false;
        type = this.flowParseTupleType();
        this.state.noAnonFunctionType = oldNoAnonFunctionType;
        return type;
      case 47:
        {
          const node = this.startNode();
          node.typeParameters = this.flowParseTypeParameterDeclaration();
          this.expect(10);
          tmp = this.flowParseFunctionTypeParams();
          node.params = tmp.params;
          node.rest = tmp.rest;
          node.this = tmp._this;
          this.expect(11);
          this.expect(19);
          node.returnType = this.flowParseType();
          return this.finishNode(node, "FunctionTypeAnnotation");
        }
      case 10:
        {
          const node = this.startNode();
          this.next();
          if (!this.match(11) && !this.match(21)) {
            if (tokenIsIdentifier(this.state.type) || this.match(78)) {
              const token = this.lookahead().type;
              isGroupedType = token !== 17 && token !== 14;
            } else {
              isGroupedType = true;
            }
          }
          if (isGroupedType) {
            this.state.noAnonFunctionType = false;
            type = this.flowParseType();
            this.state.noAnonFunctionType = oldNoAnonFunctionType;
            if (this.state.noAnonFunctionType || !(this.match(12) || this.match(11) && this.lookahead().type === 19)) {
              this.expect(11);
              return type;
            } else {
              this.eat(12);
            }
          }
          if (type) {
            tmp = this.flowParseFunctionTypeParams([this.reinterpretTypeAsFunctionTypeParam(type)]);
          } else {
            tmp = this.flowParseFunctionTypeParams();
          }
          node.params = tmp.params;
          node.rest = tmp.rest;
          node.this = tmp._this;
          this.expect(11);
          this.expect(19);
          node.returnType = this.flowParseType();
          node.typeParameters = null;
          return this.finishNode(node, "FunctionTypeAnnotation");
        }
      case 134:
        return this.parseLiteral(this.state.value, "StringLiteralTypeAnnotation");
      case 85:
      case 86:
        node.value = this.match(85);
        this.next();
        return this.finishNode(node, "BooleanLiteralTypeAnnotation");
      case 53:
        if (this.state.value === "-") {
          this.next();
          if (this.match(135)) {
            return this.parseLiteralAtNode(-this.state.value, "NumberLiteralTypeAnnotation", node);
          }
          if (this.match(136)) {
            return this.parseLiteralAtNode(-this.state.value, "BigIntLiteralTypeAnnotation", node);
          }
          throw this.raise(FlowErrors.UnexpectedSubtractionOperand, this.state.startLoc);
        }
        throw this.unexpected();
      case 135:
        return this.parseLiteral(this.state.value, "NumberLiteralTypeAnnotation");
      case 136:
        return this.parseLiteral(this.state.value, "BigIntLiteralTypeAnnotation");
      case 88:
        this.next();
        return this.finishNode(node, "VoidTypeAnnotation");
      case 84:
        this.next();
        return this.finishNode(node, "NullLiteralTypeAnnotation");
      case 78:
        this.next();
        return this.finishNode(node, "ThisTypeAnnotation");
      case 55:
        this.next();
        return this.finishNode(node, "ExistsTypeAnnotation");
      case 87:
        return this.flowParseTypeofType();
      default:
        if (tokenIsKeyword(this.state.type)) {
          const label = tokenLabelName(this.state.type);
          this.next();
          return super.createIdentifier(node, label);
        } else if (tokenIsIdentifier(this.state.type)) {
          if (this.isContextual(129)) {
            return this.flowParseInterfaceType();
          }
          return this.flowIdentToTypeAnnotation(startLoc, node, this.parseIdentifier());
        }
    }
    throw this.unexpected();
  }
  flowParsePostfixType() {
    const startLoc = this.state.startLoc;
    let type = this.flowParsePrimaryType();
    let seenOptionalIndexedAccess = false;
    while ((this.match(0) || this.match(18)) && !this.canInsertSemicolon()) {
      const node = this.startNodeAt(startLoc);
      const optional = this.eat(18);
      seenOptionalIndexedAccess = seenOptionalIndexedAccess || optional;
      this.expect(0);
      if (!optional && this.match(3)) {
        node.elementType = type;
        this.next();
        type = this.finishNode(node, "ArrayTypeAnnotation");
      } else {
        node.objectType = type;
        node.indexType = this.flowParseType();
        this.expect(3);
        if (seenOptionalIndexedAccess) {
          node.optional = optional;
          type = this.finishNode(node, "OptionalIndexedAccessType");
        } else {
          type = this.finishNode(node, "IndexedAccessType");
        }
      }
    }
    return type;
  }
  flowParsePrefixType() {
    const node = this.startNode();
    if (this.eat(17)) {
      node.typeAnnotation = this.flowParsePrefixType();
      return this.finishNode(node, "NullableTypeAnnotation");
    } else {
      return this.flowParsePostfixType();
    }
  }
  flowParseAnonFunctionWithoutParens() {
    const param = this.flowParsePrefixType();
    if (!this.state.noAnonFunctionType && this.eat(19)) {
      const node = this.startNodeAt(param.loc.start);
      node.params = [this.reinterpretTypeAsFunctionTypeParam(param)];
      node.rest = null;
      node.this = null;
      node.returnType = this.flowParseType();
      node.typeParameters = null;
      return this.finishNode(node, "FunctionTypeAnnotation");
    }
    return param;
  }
  flowParseIntersectionType() {
    const node = this.startNode();
    this.eat(45);
    const type = this.flowParseAnonFunctionWithoutParens();
    node.types = [type];
    while (this.eat(45)) {
      node.types.push(this.flowParseAnonFunctionWithoutParens());
    }
    return node.types.length === 1 ? type : this.finishNode(node, "IntersectionTypeAnnotation");
  }
  flowParseUnionType() {
    const node = this.startNode();
    this.eat(43);
    const type = this.flowParseIntersectionType();
    node.types = [type];
    while (this.eat(43)) {
      node.types.push(this.flowParseIntersectionType());
    }
    return node.types.length === 1 ? type : this.finishNode(node, "UnionTypeAnnotation");
  }
  flowParseType() {
    const oldInType = this.state.inType;
    this.state.inType = true;
    const type = this.flowParseUnionType();
    this.state.inType = oldInType;
    return type;
  }
  flowParseTypeOrImplicitInstantiation() {
    if (this.state.type === 132 && this.state.value === "_") {
      const startLoc = this.state.startLoc;
      const node = this.parseIdentifier();
      return this.flowParseGenericType(startLoc, node);
    } else {
      return this.flowParseType();
    }
  }
  flowParseTypeAnnotation() {
    const node = this.startNode();
    node.typeAnnotation = this.flowParseTypeInitialiser();
    return this.finishNode(node, "TypeAnnotation");
  }
  flowParseTypeAnnotatableIdentifier() {
    const node = this.startNode();
    const name = this.parseIdentifierName();
    if (this.match(14)) {
      node.typeAnnotation = this.flowParseTypeAnnotation();
    }
    return this.createIdentifier(node, name);
  }
  typeCastToParameter(node) {
    node.expression.typeAnnotation = node.typeAnnotation;
    this.resetEndLocation(node.expression, node.typeAnnotation.loc.end);
    return node.expression;
  }
  flowParseVariance() {
    let variance = null;
    if (this.match(53)) {
      variance = this.startNode();
      if (this.state.value === "+") {
        variance.kind = "plus";
      } else {
        variance.kind = "minus";
      }
      this.next();
      return this.finishNode(variance, "Variance");
    }
    return variance;
  }
  parseFunctionBody(node, allowExpressionBody, isMethod = false) {
    if (allowExpressionBody) {
      this.forwardNoArrowParamsConversionAt(node, () => super.parseFunctionBody(node, true, isMethod));
      return;
    }
    super.parseFunctionBody(node, false, isMethod);
  }
  parseFunctionBodyAndFinish(node, type, isMethod = false) {
    if (this.match(14)) {
      const typeNode = this.startNode();
      [typeNode.typeAnnotation, node.predicate] = this.flowParseTypeAndPredicateInitialiser();
      node.returnType = typeNode.typeAnnotation ? this.finishNode(typeNode, "TypeAnnotation") : null;
    }
    return super.parseFunctionBodyAndFinish(node, type, isMethod);
  }
  parseStatementLike(flags) {
    if (this.state.strict && this.isContextual(129)) {
      const lookahead = this.lookahead();
      if (tokenIsKeywordOrIdentifier(lookahead.type)) {
        const node = this.startNode();
        this.next();
        return this.flowParseInterface(node);
      }
    } else if (this.isContextual(126)) {
      const node = this.startNode();
      this.next();
      return this.flowParseEnumDeclaration(node);
    }
    const stmt = super.parseStatementLike(flags);
    if (this.flowPragma === undefined && !this.isValidDirective(stmt)) {
      this.flowPragma = null;
    }
    return stmt;
  }
  parseExpressionStatement(node, expr, decorators) {
    if (expr.type === "Identifier") {
      if (expr.name === "declare") {
        if (this.match(80) || tokenIsIdentifier(this.state.type) || this.match(68) || this.match(74) || this.match(82)) {
          return this.flowParseDeclare(node);
        }
      } else if (tokenIsIdentifier(this.state.type)) {
        if (expr.name === "interface") {
          return this.flowParseInterface(node);
        } else if (expr.name === "type") {
          return this.flowParseTypeAlias(node);
        } else if (expr.name === "opaque") {
          return this.flowParseOpaqueType(node, false);
        }
      }
    }
    return super.parseExpressionStatement(node, expr, decorators);
  }
  shouldParseExportDeclaration() {
    const {
      type
    } = this.state;
    if (type === 126 || tokenIsFlowInterfaceOrTypeOrOpaque(type)) {
      return !this.state.containsEsc;
    }
    return super.shouldParseExportDeclaration();
  }
  isExportDefaultSpecifier() {
    const {
      type
    } = this.state;
    if (type === 126 || tokenIsFlowInterfaceOrTypeOrOpaque(type)) {
      return this.state.containsEsc;
    }
    return super.isExportDefaultSpecifier();
  }
  parseExportDefaultExpression() {
    if (this.isContextual(126)) {
      const node = this.startNode();
      this.next();
      return this.flowParseEnumDeclaration(node);
    }
    return super.parseExportDefaultExpression();
  }
  parseConditional(expr, startLoc, refExpressionErrors) {
    if (!this.match(17)) return expr;
    if (this.state.maybeInArrowParameters) {
      const nextCh = this.lookaheadCharCode();
      if (nextCh === 44 || nextCh === 61 || nextCh === 58 || nextCh === 41) {
        this.setOptionalParametersError(refExpressionErrors);
        return expr;
      }
    }
    this.expect(17);
    const state = this.state.clone();
    const originalNoArrowAt = this.state.noArrowAt;
    const node = this.startNodeAt(startLoc);
    let {
      consequent,
      failed
    } = this.tryParseConditionalConsequent();
    let [valid, invalid] = this.getArrowLikeExpressions(consequent);
    if (failed || invalid.length > 0) {
      const noArrowAt = [...originalNoArrowAt];
      if (invalid.length > 0) {
        this.state = state;
        this.state.noArrowAt = noArrowAt;
        for (let i = 0; i < invalid.length; i++) {
          noArrowAt.push(invalid[i].start);
        }
        ({
          consequent,
          failed
        } = this.tryParseConditionalConsequent());
        [valid, invalid] = this.getArrowLikeExpressions(consequent);
      }
      if (failed && valid.length > 1) {
        this.raise(FlowErrors.AmbiguousConditionalArrow, state.startLoc);
      }
      if (failed && valid.length === 1) {
        this.state = state;
        noArrowAt.push(valid[0].start);
        this.state.noArrowAt = noArrowAt;
        ({
          consequent,
          failed
        } = this.tryParseConditionalConsequent());
      }
    }
    this.getArrowLikeExpressions(consequent, true);
    this.state.noArrowAt = originalNoArrowAt;
    this.expect(14);
    node.test = expr;
    node.consequent = consequent;
    node.alternate = this.forwardNoArrowParamsConversionAt(node, () => this.parseMaybeAssign(undefined, undefined));
    return this.finishNode(node, "ConditionalExpression");
  }
  tryParseConditionalConsequent() {
    this.state.noArrowParamsConversionAt.push(this.state.start);
    const consequent = this.parseMaybeAssignAllowIn();
    const failed = !this.match(14);
    this.state.noArrowParamsConversionAt.pop();
    return {
      consequent,
      failed
    };
  }
  getArrowLikeExpressions(node, disallowInvalid) {
    const stack = [node];
    const arrows = [];
    while (stack.length !== 0) {
      const node = stack.pop();
      if (node.type === "ArrowFunctionExpression" && node.body.type !== "BlockStatement") {
        if (node.typeParameters || !node.returnType) {
          this.finishArrowValidation(node);
        } else {
          arrows.push(node);
        }
        stack.push(node.body);
      } else if (node.type === "ConditionalExpression") {
        stack.push(node.consequent);
        stack.push(node.alternate);
      }
    }
    if (disallowInvalid) {
      arrows.forEach(node => this.finishArrowValidation(node));
      return [arrows, []];
    }
    return partition(arrows, node => node.params.every(param => this.isAssignable(param, true)));
  }
  finishArrowValidation(node) {
    var _node$extra;
    this.toAssignableList(node.params, (_node$extra = node.extra) == null ? void 0 : _node$extra.trailingCommaLoc, false);
    this.scope.enter(514 | 4);
    super.checkParams(node, false, true);
    this.scope.exit();
  }
  forwardNoArrowParamsConversionAt(node, parse) {
    let result;
    if (this.state.noArrowParamsConversionAt.includes(this.offsetToSourcePos(node.start))) {
      this.state.noArrowParamsConversionAt.push(this.state.start);
      result = parse();
      this.state.noArrowParamsConversionAt.pop();
    } else {
      result = parse();
    }
    return result;
  }
  parseParenItem(node, startLoc) {
    const newNode = super.parseParenItem(node, startLoc);
    if (this.eat(17)) {
      newNode.optional = true;
      this.resetEndLocation(node);
    }
    if (this.match(14)) {
      const typeCastNode = this.startNodeAt(startLoc);
      typeCastNode.expression = newNode;
      typeCastNode.typeAnnotation = this.flowParseTypeAnnotation();
      return this.finishNode(typeCastNode, "TypeCastExpression");
    }
    return newNode;
  }
  assertModuleNodeAllowed(node) {
    if (node.type === "ImportDeclaration" && (node.importKind === "type" || node.importKind === "typeof") || node.type === "ExportNamedDeclaration" && node.exportKind === "type" || node.type === "ExportAllDeclaration" && node.exportKind === "type") {
      return;
    }
    super.assertModuleNodeAllowed(node);
  }
  parseExportDeclaration(node) {
    if (this.isContextual(130)) {
      node.exportKind = "type";
      const declarationNode = this.startNode();
      this.next();
      if (this.match(5)) {
        node.specifiers = this.parseExportSpecifiers(true);
        super.parseExportFrom(node);
        return null;
      } else {
        return this.flowParseTypeAlias(declarationNode);
      }
    } else if (this.isContextual(131)) {
      node.exportKind = "type";
      const declarationNode = this.startNode();
      this.next();
      return this.flowParseOpaqueType(declarationNode, false);
    } else if (this.isContextual(129)) {
      node.exportKind = "type";
      const declarationNode = this.startNode();
      this.next();
      return this.flowParseInterface(declarationNode);
    } else if (this.isContextual(126)) {
      node.exportKind = "value";
      const declarationNode = this.startNode();
      this.next();
      return this.flowParseEnumDeclaration(declarationNode);
    } else {
      return super.parseExportDeclaration(node);
    }
  }
  eatExportStar(node) {
    if (super.eatExportStar(node)) return true;
    if (this.isContextual(130) && this.lookahead().type === 55) {
      node.exportKind = "type";
      this.next();
      this.next();
      return true;
    }
    return false;
  }
  maybeParseExportNamespaceSpecifier(node) {
    const {
      startLoc
    } = this.state;
    const hasNamespace = super.maybeParseExportNamespaceSpecifier(node);
    if (hasNamespace && node.exportKind === "type") {
      this.unexpected(startLoc);
    }
    return hasNamespace;
  }
  parseClassId(node, isStatement, optionalId) {
    super.parseClassId(node, isStatement, optionalId);
    if (this.match(47)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    }
  }
  parseClassMember(classBody, member, state) {
    const {
      startLoc
    } = this.state;
    if (this.isContextual(125)) {
      if (super.parseClassMemberFromModifier(classBody, member)) {
        return;
      }
      member.declare = true;
    }
    super.parseClassMember(classBody, member, state);
    if (member.declare) {
      if (member.type !== "ClassProperty" && member.type !== "ClassPrivateProperty" && member.type !== "PropertyDefinition") {
        this.raise(FlowErrors.DeclareClassElement, startLoc);
      } else if (member.value) {
        this.raise(FlowErrors.DeclareClassFieldInitializer, member.value);
      }
    }
  }
  isIterator(word) {
    return word === "iterator" || word === "asyncIterator";
  }
  readIterator() {
    const word = super.readWord1();
    const fullWord = "@@" + word;
    if (!this.isIterator(word) || !this.state.inType) {
      this.raise(Errors.InvalidIdentifier, this.state.curPosition(), {
        identifierName: fullWord
      });
    }
    this.finishToken(132, fullWord);
  }
  getTokenFromCode(code) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (code === 123 && next === 124) {
      this.finishOp(6, 2);
    } else if (this.state.inType && (code === 62 || code === 60)) {
      this.finishOp(code === 62 ? 48 : 47, 1);
    } else if (this.state.inType && code === 63) {
      if (next === 46) {
        this.finishOp(18, 2);
      } else {
        this.finishOp(17, 1);
      }
    } else if (isIteratorStart(code, next, this.input.charCodeAt(this.state.pos + 2))) {
      this.state.pos += 2;
      this.readIterator();
    } else {
      super.getTokenFromCode(code);
    }
  }
  isAssignable(node, isBinding) {
    if (node.type === "TypeCastExpression") {
      return this.isAssignable(node.expression, isBinding);
    } else {
      return super.isAssignable(node, isBinding);
    }
  }
  toAssignable(node, isLHS = false) {
    if (!isLHS && node.type === "AssignmentExpression" && node.left.type === "TypeCastExpression") {
      node.left = this.typeCastToParameter(node.left);
    }
    super.toAssignable(node, isLHS);
  }
  toAssignableList(exprList, trailingCommaLoc, isLHS) {
    for (let i = 0; i < exprList.length; i++) {
      const expr = exprList[i];
      if ((expr == null ? void 0 : expr.type) === "TypeCastExpression") {
        exprList[i] = this.typeCastToParameter(expr);
      }
    }
    super.toAssignableList(exprList, trailingCommaLoc, isLHS);
  }
  toReferencedList(exprList, isParenthesizedExpr) {
    for (let i = 0; i < exprList.length; i++) {
      var _expr$extra;
      const expr = exprList[i];
      if (expr && expr.type === "TypeCastExpression" && !((_expr$extra = expr.extra) != null && _expr$extra.parenthesized) && (exprList.length > 1 || !isParenthesizedExpr)) {
        this.raise(FlowErrors.TypeCastInPattern, expr.typeAnnotation);
      }
    }
    return exprList;
  }
  parseArrayLike(close, isTuple, refExpressionErrors) {
    const node = super.parseArrayLike(close, isTuple, refExpressionErrors);
    if (refExpressionErrors != null && !this.state.maybeInArrowParameters) {
      this.toReferencedList(node.elements);
    }
    return node;
  }
  isValidLVal(type, disallowCallExpression, isParenthesized, binding) {
    return type === "TypeCastExpression" || super.isValidLVal(type, disallowCallExpression, isParenthesized, binding);
  }
  parseClassProperty(node) {
    if (this.match(14)) {
      node.typeAnnotation = this.flowParseTypeAnnotation();
    }
    return super.parseClassProperty(node);
  }
  parseClassPrivateProperty(node) {
    if (this.match(14)) {
      node.typeAnnotation = this.flowParseTypeAnnotation();
    }
    return super.parseClassPrivateProperty(node);
  }
  isClassMethod() {
    return this.match(47) || super.isClassMethod();
  }
  isClassProperty() {
    return this.match(14) || super.isClassProperty();
  }
  isNonstaticConstructor(method) {
    return !this.match(14) && super.isNonstaticConstructor(method);
  }
  pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper) {
    if (method.variance) {
      this.unexpected(method.variance.loc.start);
    }
    delete method.variance;
    if (this.match(47)) {
      method.typeParameters = this.flowParseTypeParameterDeclaration();
    }
    super.pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper);
    if (method.params && isConstructor) {
      const params = method.params;
      if (params.length > 0 && this.isThisParam(params[0])) {
        this.raise(FlowErrors.ThisParamBannedInConstructor, method);
      }
    } else if (method.type === "MethodDefinition" && isConstructor && method.value.params) {
      const params = method.value.params;
      if (params.length > 0 && this.isThisParam(params[0])) {
        this.raise(FlowErrors.ThisParamBannedInConstructor, method);
      }
    }
  }
  pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
    if (method.variance) {
      this.unexpected(method.variance.loc.start);
    }
    delete method.variance;
    if (this.match(47)) {
      method.typeParameters = this.flowParseTypeParameterDeclaration();
    }
    super.pushClassPrivateMethod(classBody, method, isGenerator, isAsync);
  }
  parseClassSuper(node) {
    super.parseClassSuper(node);
    if (node.superClass && (this.match(47) || this.match(51))) {
      node.superTypeParameters = this.flowParseTypeParameterInstantiationInExpression();
    }
    if (this.isContextual(113)) {
      this.next();
      const implemented = node.implements = [];
      do {
        const node = this.startNode();
        node.id = this.flowParseRestrictedIdentifier(true);
        if (this.match(47)) {
          node.typeParameters = this.flowParseTypeParameterInstantiation();
        } else {
          node.typeParameters = null;
        }
        implemented.push(this.finishNode(node, "ClassImplements"));
      } while (this.eat(12));
    }
  }
  checkGetterSetterParams(method) {
    super.checkGetterSetterParams(method);
    const params = this.getObjectOrClassMethodParams(method);
    if (params.length > 0) {
      const param = params[0];
      if (this.isThisParam(param) && method.kind === "get") {
        this.raise(FlowErrors.GetterMayNotHaveThisParam, param);
      } else if (this.isThisParam(param)) {
        this.raise(FlowErrors.SetterMayNotHaveThisParam, param);
      }
    }
  }
  parsePropertyNamePrefixOperator(node) {
    node.variance = this.flowParseVariance();
  }
  parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors) {
    if (prop.variance) {
      this.unexpected(prop.variance.loc.start);
    }
    delete prop.variance;
    let typeParameters;
    if (this.match(47) && !isAccessor) {
      typeParameters = this.flowParseTypeParameterDeclaration();
      if (!this.match(10)) this.unexpected();
    }
    const result = super.parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors);
    if (typeParameters) {
      (result.value || result).typeParameters = typeParameters;
    }
    return result;
  }
  parseFunctionParamType(param) {
    if (this.eat(17)) {
      if (param.type !== "Identifier") {
        this.raise(FlowErrors.PatternIsOptional, param);
      }
      if (this.isThisParam(param)) {
        this.raise(FlowErrors.ThisParamMayNotBeOptional, param);
      }
      param.optional = true;
    }
    if (this.match(14)) {
      param.typeAnnotation = this.flowParseTypeAnnotation();
    } else if (this.isThisParam(param)) {
      this.raise(FlowErrors.ThisParamAnnotationRequired, param);
    }
    if (this.match(29) && this.isThisParam(param)) {
      this.raise(FlowErrors.ThisParamNoDefault, param);
    }
    this.resetEndLocation(param);
    return param;
  }
  parseMaybeDefault(startLoc, left) {
    const node = super.parseMaybeDefault(startLoc, left);
    if (node.type === "AssignmentPattern" && node.typeAnnotation && node.right.start < node.typeAnnotation.start) {
      this.raise(FlowErrors.TypeBeforeInitializer, node.typeAnnotation);
    }
    return node;
  }
  checkImportReflection(node) {
    super.checkImportReflection(node);
    if (node.module && node.importKind !== "value") {
      this.raise(FlowErrors.ImportReflectionHasImportType, node.specifiers[0].loc.start);
    }
  }
  parseImportSpecifierLocal(node, specifier, type) {
    specifier.local = hasTypeImportKind(node) ? this.flowParseRestrictedIdentifier(true, true) : this.parseIdentifier();
    node.specifiers.push(this.finishImportSpecifier(specifier, type));
  }
  isPotentialImportPhase(isExport) {
    if (super.isPotentialImportPhase(isExport)) return true;
    if (this.isContextual(130)) {
      if (!isExport) return true;
      const ch = this.lookaheadCharCode();
      return ch === 123 || ch === 42;
    }
    return !isExport && this.isContextual(87);
  }
  applyImportPhase(node, isExport, phase, loc) {
    super.applyImportPhase(node, isExport, phase, loc);
    if (isExport) {
      if (!phase && this.match(65)) {
        return;
      }
      node.exportKind = phase === "type" ? phase : "value";
    } else {
      if (phase === "type" && this.match(55)) this.unexpected();
      node.importKind = phase === "type" || phase === "typeof" ? phase : "value";
    }
  }
  parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, bindingType) {
    const firstIdent = specifier.imported;
    let specifierTypeKind = null;
    if (firstIdent.type === "Identifier") {
      if (firstIdent.name === "type") {
        specifierTypeKind = "type";
      } else if (firstIdent.name === "typeof") {
        specifierTypeKind = "typeof";
      }
    }
    let isBinding = false;
    if (this.isContextual(93) && !this.isLookaheadContextual("as")) {
      const as_ident = this.parseIdentifier(true);
      if (specifierTypeKind !== null && !tokenIsKeywordOrIdentifier(this.state.type)) {
        specifier.imported = as_ident;
        specifier.importKind = specifierTypeKind;
        specifier.local = this.cloneIdentifier(as_ident);
      } else {
        specifier.imported = firstIdent;
        specifier.importKind = null;
        specifier.local = this.parseIdentifier();
      }
    } else {
      if (specifierTypeKind !== null && tokenIsKeywordOrIdentifier(this.state.type)) {
        specifier.imported = this.parseIdentifier(true);
        specifier.importKind = specifierTypeKind;
      } else {
        if (importedIsString) {
          throw this.raise(Errors.ImportBindingIsString, specifier, {
            importName: firstIdent.value
          });
        }
        specifier.imported = firstIdent;
        specifier.importKind = null;
      }
      if (this.eatContextual(93)) {
        specifier.local = this.parseIdentifier();
      } else {
        isBinding = true;
        specifier.local = this.cloneIdentifier(specifier.imported);
      }
    }
    const specifierIsTypeImport = hasTypeImportKind(specifier);
    if (isInTypeOnlyImport && specifierIsTypeImport) {
      this.raise(FlowErrors.ImportTypeShorthandOnlyInPureImport, specifier);
    }
    if (isInTypeOnlyImport || specifierIsTypeImport) {
      this.checkReservedType(specifier.local.name, specifier.local.loc.start, true);
    }
    if (isBinding && !isInTypeOnlyImport && !specifierIsTypeImport) {
      this.checkReservedWord(specifier.local.name, specifier.loc.start, true, true);
    }
    return this.finishImportSpecifier(specifier, "ImportSpecifier");
  }
  parseBindingAtom() {
    switch (this.state.type) {
      case 78:
        return this.parseIdentifier(true);
      default:
        return super.parseBindingAtom();
    }
  }
  parseFunctionParams(node, isConstructor) {
    const kind = node.kind;
    if (kind !== "get" && kind !== "set" && this.match(47)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    }
    super.parseFunctionParams(node, isConstructor);
  }
  parseVarId(decl, kind) {
    super.parseVarId(decl, kind);
    if (this.match(14)) {
      decl.id.typeAnnotation = this.flowParseTypeAnnotation();
      this.resetEndLocation(decl.id);
    }
  }
  parseAsyncArrowFromCallExpression(node, call) {
    if (this.match(14)) {
      const oldNoAnonFunctionType = this.state.noAnonFunctionType;
      this.state.noAnonFunctionType = true;
      node.returnType = this.flowParseTypeAnnotation();
      this.state.noAnonFunctionType = oldNoAnonFunctionType;
    }
    return super.parseAsyncArrowFromCallExpression(node, call);
  }
  shouldParseAsyncArrow() {
    return this.match(14) || super.shouldParseAsyncArrow();
  }
  parseMaybeAssign(refExpressionErrors, afterLeftParse) {
    var _jsx;
    let state = null;
    let jsx;
    if (this.hasPlugin("jsx") && (this.match(143) || this.match(47))) {
      state = this.state.clone();
      jsx = this.tryParse(() => super.parseMaybeAssign(refExpressionErrors, afterLeftParse), state);
      if (!jsx.error) return jsx.node;
      const {
        context
      } = this.state;
      const currentContext = context[context.length - 1];
      if (currentContext === types.j_oTag || currentContext === types.j_expr) {
        context.pop();
      }
    }
    if ((_jsx = jsx) != null && _jsx.error || this.match(47)) {
      var _jsx2, _jsx3;
      state = state || this.state.clone();
      let typeParameters;
      const arrow = this.tryParse(abort => {
        var _arrowExpression$extr;
        typeParameters = this.flowParseTypeParameterDeclaration();
        const arrowExpression = this.forwardNoArrowParamsConversionAt(typeParameters, () => {
          const result = super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
          this.resetStartLocationFromNode(result, typeParameters);
          return result;
        });
        if ((_arrowExpression$extr = arrowExpression.extra) != null && _arrowExpression$extr.parenthesized) abort();
        const expr = this.maybeUnwrapTypeCastExpression(arrowExpression);
        if (expr.type !== "ArrowFunctionExpression") abort();
        expr.typeParameters = typeParameters;
        this.resetStartLocationFromNode(expr, typeParameters);
        return arrowExpression;
      }, state);
      let arrowExpression = null;
      if (arrow.node && this.maybeUnwrapTypeCastExpression(arrow.node).type === "ArrowFunctionExpression") {
        if (!arrow.error && !arrow.aborted) {
          if (arrow.node.async) {
            this.raise(FlowErrors.UnexpectedTypeParameterBeforeAsyncArrowFunction, typeParameters);
          }
          return arrow.node;
        }
        arrowExpression = arrow.node;
      }
      if ((_jsx2 = jsx) != null && _jsx2.node) {
        this.state = jsx.failState;
        return jsx.node;
      }
      if (arrowExpression) {
        this.state = arrow.failState;
        return arrowExpression;
      }
      if ((_jsx3 = jsx) != null && _jsx3.thrown) throw jsx.error;
      if (arrow.thrown) throw arrow.error;
      throw this.raise(FlowErrors.UnexpectedTokenAfterTypeParameter, typeParameters);
    }
    return super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
  }
  parseArrow(node) {
    if (this.match(14)) {
      const result = this.tryParse(() => {
        const oldNoAnonFunctionType = this.state.noAnonFunctionType;
        this.state.noAnonFunctionType = true;
        const typeNode = this.startNode();
        [typeNode.typeAnnotation, node.predicate] = this.flowParseTypeAndPredicateInitialiser();
        this.state.noAnonFunctionType = oldNoAnonFunctionType;
        if (this.canInsertSemicolon()) this.unexpected();
        if (!this.match(19)) this.unexpected();
        return typeNode;
      });
      if (result.thrown) return null;
      if (result.error) this.state = result.failState;
      node.returnType = result.node.typeAnnotation ? this.finishNode(result.node, "TypeAnnotation") : null;
    }
    return super.parseArrow(node);
  }
  shouldParseArrow(params) {
    return this.match(14) || super.shouldParseArrow(params);
  }
  setArrowFunctionParameters(node, params) {
    if (this.state.noArrowParamsConversionAt.includes(this.offsetToSourcePos(node.start))) {
      node.params = params;
    } else {
      super.setArrowFunctionParameters(node, params);
    }
  }
  checkParams(node, allowDuplicates, isArrowFunction, strictModeChanged = true) {
    if (isArrowFunction && this.state.noArrowParamsConversionAt.includes(this.offsetToSourcePos(node.start))) {
      return;
    }
    for (let i = 0; i < node.params.length; i++) {
      if (this.isThisParam(node.params[i]) && i > 0) {
        this.raise(FlowErrors.ThisParamMustBeFirst, node.params[i]);
      }
    }
    super.checkParams(node, allowDuplicates, isArrowFunction, strictModeChanged);
  }
  parseParenAndDistinguishExpression(canBeArrow) {
    return super.parseParenAndDistinguishExpression(canBeArrow && !this.state.noArrowAt.includes(this.sourceToOffsetPos(this.state.start)));
  }
  parseSubscripts(base, startLoc, noCalls) {
    if (base.type === "Identifier" && base.name === "async" && this.state.noArrowAt.includes(startLoc.index)) {
      this.next();
      const node = this.startNodeAt(startLoc);
      node.callee = base;
      node.arguments = super.parseCallExpressionArguments();
      base = this.finishNode(node, "CallExpression");
    } else if (base.type === "Identifier" && base.name === "async" && this.match(47)) {
      const state = this.state.clone();
      const arrow = this.tryParse(abort => this.parseAsyncArrowWithTypeParameters(startLoc) || abort(), state);
      if (!arrow.error && !arrow.aborted) return arrow.node;
      const result = this.tryParse(() => super.parseSubscripts(base, startLoc, noCalls), state);
      if (result.node && !result.error) return result.node;
      if (arrow.node) {
        this.state = arrow.failState;
        return arrow.node;
      }
      if (result.node) {
        this.state = result.failState;
        return result.node;
      }
      throw arrow.error || result.error;
    }
    return super.parseSubscripts(base, startLoc, noCalls);
  }
  parseSubscript(base, startLoc, noCalls, subscriptState) {
    if (this.match(18) && this.isLookaheadToken_lt()) {
      subscriptState.optionalChainMember = true;
      if (noCalls) {
        subscriptState.stop = true;
        return base;
      }
      this.next();
      const node = this.startNodeAt(startLoc);
      node.callee = base;
      node.typeArguments = this.flowParseTypeParameterInstantiationInExpression();
      this.expect(10);
      node.arguments = this.parseCallExpressionArguments();
      node.optional = true;
      return this.finishCallExpression(node, true);
    } else if (!noCalls && this.shouldParseTypes() && (this.match(47) || this.match(51))) {
      const node = this.startNodeAt(startLoc);
      node.callee = base;
      const result = this.tryParse(() => {
        node.typeArguments = this.flowParseTypeParameterInstantiationCallOrNew();
        this.expect(10);
        node.arguments = super.parseCallExpressionArguments();
        if (subscriptState.optionalChainMember) {
          node.optional = false;
        }
        return this.finishCallExpression(node, subscriptState.optionalChainMember);
      });
      if (result.node) {
        if (result.error) this.state = result.failState;
        return result.node;
      }
    }
    return super.parseSubscript(base, startLoc, noCalls, subscriptState);
  }
  parseNewCallee(node) {
    super.parseNewCallee(node);
    let targs = null;
    if (this.shouldParseTypes() && this.match(47)) {
      targs = this.tryParse(() => this.flowParseTypeParameterInstantiationCallOrNew()).node;
    }
    node.typeArguments = targs;
  }
  parseAsyncArrowWithTypeParameters(startLoc) {
    const node = this.startNodeAt(startLoc);
    this.parseFunctionParams(node, false);
    if (!this.parseArrow(node)) return;
    return super.parseArrowExpression(node, undefined, true);
  }
  readToken_mult_modulo(code) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (code === 42 && next === 47 && this.state.hasFlowComment) {
      this.state.hasFlowComment = false;
      this.state.pos += 2;
      this.nextToken();
      return;
    }
    super.readToken_mult_modulo(code);
  }
  readToken_pipe_amp(code) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (code === 124 && next === 125) {
      this.finishOp(9, 2);
      return;
    }
    super.readToken_pipe_amp(code);
  }
  parseTopLevel(file, program) {
    const fileNode = super.parseTopLevel(file, program);
    if (this.state.hasFlowComment) {
      this.raise(FlowErrors.UnterminatedFlowComment, this.state.curPosition());
    }
    return fileNode;
  }
  skipBlockComment() {
    if (this.hasPlugin("flowComments") && this.skipFlowComment()) {
      if (this.state.hasFlowComment) {
        throw this.raise(FlowErrors.NestedFlowComment, this.state.startLoc);
      }
      this.hasFlowCommentCompletion();
      const commentSkip = this.skipFlowComment();
      if (commentSkip) {
        this.state.pos += commentSkip;
        this.state.hasFlowComment = true;
      }
      return;
    }
    return super.skipBlockComment(this.state.hasFlowComment ? "*-/" : "*/");
  }
  skipFlowComment() {
    const {
      pos
    } = this.state;
    let shiftToFirstNonWhiteSpace = 2;
    while ([32, 9].includes(this.input.charCodeAt(pos + shiftToFirstNonWhiteSpace))) {
      shiftToFirstNonWhiteSpace++;
    }
    const ch2 = this.input.charCodeAt(shiftToFirstNonWhiteSpace + pos);
    const ch3 = this.input.charCodeAt(shiftToFirstNonWhiteSpace + pos + 1);
    if (ch2 === 58 && ch3 === 58) {
      return shiftToFirstNonWhiteSpace + 2;
    }
    if (this.input.slice(shiftToFirstNonWhiteSpace + pos, shiftToFirstNonWhiteSpace + pos + 12) === "flow-include") {
      return shiftToFirstNonWhiteSpace + 12;
    }
    if (ch2 === 58 && ch3 !== 58) {
      return shiftToFirstNonWhiteSpace;
    }
    return false;
  }
  hasFlowCommentCompletion() {
    const end = this.input.indexOf("*/", this.state.pos);
    if (end === -1) {
      throw this.raise(Errors.UnterminatedComment, this.state.curPosition());
    }
  }
  flowEnumErrorBooleanMemberNotInitialized(loc, {
    enumName,
    memberName
  }) {
    this.raise(FlowErrors.EnumBooleanMemberNotInitialized, loc, {
      memberName,
      enumName
    });
  }
  flowEnumErrorInvalidMemberInitializer(loc, enumContext) {
    return this.raise(!enumContext.explicitType ? FlowErrors.EnumInvalidMemberInitializerUnknownType : enumContext.explicitType === "symbol" ? FlowErrors.EnumInvalidMemberInitializerSymbolType : FlowErrors.EnumInvalidMemberInitializerPrimaryType, loc, enumContext);
  }
  flowEnumErrorNumberMemberNotInitialized(loc, details) {
    this.raise(FlowErrors.EnumNumberMemberNotInitialized, loc, details);
  }
  flowEnumErrorStringMemberInconsistentlyInitialized(node, details) {
    this.raise(FlowErrors.EnumStringMemberInconsistentlyInitialized, node, details);
  }
  flowEnumMemberInit() {
    const startLoc = this.state.startLoc;
    const endOfInit = () => this.match(12) || this.match(8);
    switch (this.state.type) {
      case 135:
        {
          const literal = this.parseNumericLiteral(this.state.value);
          if (endOfInit()) {
            return {
              type: "number",
              loc: literal.loc.start,
              value: literal
            };
          }
          return {
            type: "invalid",
            loc: startLoc
          };
        }
      case 134:
        {
          const literal = this.parseStringLiteral(this.state.value);
          if (endOfInit()) {
            return {
              type: "string",
              loc: literal.loc.start,
              value: literal
            };
          }
          return {
            type: "invalid",
            loc: startLoc
          };
        }
      case 85:
      case 86:
        {
          const literal = this.parseBooleanLiteral(this.match(85));
          if (endOfInit()) {
            return {
              type: "boolean",
              loc: literal.loc.start,
              value: literal
            };
          }
          return {
            type: "invalid",
            loc: startLoc
          };
        }
      default:
        return {
          type: "invalid",
          loc: startLoc
        };
    }
  }
  flowEnumMemberRaw() {
    const loc = this.state.startLoc;
    const id = this.parseIdentifier(true);
    const init = this.eat(29) ? this.flowEnumMemberInit() : {
      type: "none",
      loc
    };
    return {
      id,
      init
    };
  }
  flowEnumCheckExplicitTypeMismatch(loc, context, expectedType) {
    const {
      explicitType
    } = context;
    if (explicitType === null) {
      return;
    }
    if (explicitType !== expectedType) {
      this.flowEnumErrorInvalidMemberInitializer(loc, context);
    }
  }
  flowEnumMembers({
    enumName,
    explicitType
  }) {
    const seenNames = new Set();
    const members = {
      booleanMembers: [],
      numberMembers: [],
      stringMembers: [],
      defaultedMembers: []
    };
    let hasUnknownMembers = false;
    while (!this.match(8)) {
      if (this.eat(21)) {
        hasUnknownMembers = true;
        break;
      }
      const memberNode = this.startNode();
      const {
        id,
        init
      } = this.flowEnumMemberRaw();
      const memberName = id.name;
      if (memberName === "") {
        continue;
      }
      if (/^[a-z]/.test(memberName)) {
        this.raise(FlowErrors.EnumInvalidMemberName, id, {
          memberName,
          suggestion: memberName[0].toUpperCase() + memberName.slice(1),
          enumName
        });
      }
      if (seenNames.has(memberName)) {
        this.raise(FlowErrors.EnumDuplicateMemberName, id, {
          memberName,
          enumName
        });
      }
      seenNames.add(memberName);
      const context = {
        enumName,
        explicitType,
        memberName
      };
      memberNode.id = id;
      switch (init.type) {
        case "boolean":
          {
            this.flowEnumCheckExplicitTypeMismatch(init.loc, context, "boolean");
            memberNode.init = init.value;
            members.booleanMembers.push(this.finishNode(memberNode, "EnumBooleanMember"));
            break;
          }
        case "number":
          {
            this.flowEnumCheckExplicitTypeMismatch(init.loc, context, "number");
            memberNode.init = init.value;
            members.numberMembers.push(this.finishNode(memberNode, "EnumNumberMember"));
            break;
          }
        case "string":
          {
            this.flowEnumCheckExplicitTypeMismatch(init.loc, context, "string");
            memberNode.init = init.value;
            members.stringMembers.push(this.finishNode(memberNode, "EnumStringMember"));
            break;
          }
        case "invalid":
          {
            throw this.flowEnumErrorInvalidMemberInitializer(init.loc, context);
          }
        case "none":
          {
            switch (explicitType) {
              case "boolean":
                this.flowEnumErrorBooleanMemberNotInitialized(init.loc, context);
                break;
              case "number":
                this.flowEnumErrorNumberMemberNotInitialized(init.loc, context);
                break;
              default:
                members.defaultedMembers.push(this.finishNode(memberNode, "EnumDefaultedMember"));
            }
          }
      }
      if (!this.match(8)) {
        this.expect(12);
      }
    }
    return {
      members,
      hasUnknownMembers
    };
  }
  flowEnumStringMembers(initializedMembers, defaultedMembers, {
    enumName
  }) {
    if (initializedMembers.length === 0) {
      return defaultedMembers;
    } else if (defaultedMembers.length === 0) {
      return initializedMembers;
    } else if (defaultedMembers.length > initializedMembers.length) {
      for (const member of initializedMembers) {
        this.flowEnumErrorStringMemberInconsistentlyInitialized(member, {
          enumName
        });
      }
      return defaultedMembers;
    } else {
      for (const member of defaultedMembers) {
        this.flowEnumErrorStringMemberInconsistentlyInitialized(member, {
          enumName
        });
      }
      return initializedMembers;
    }
  }
  flowEnumParseExplicitType({
    enumName
  }) {
    if (!this.eatContextual(102)) return null;
    if (!tokenIsIdentifier(this.state.type)) {
      throw this.raise(FlowErrors.EnumInvalidExplicitTypeUnknownSupplied, this.state.startLoc, {
        enumName
      });
    }
    const {
      value
    } = this.state;
    this.next();
    if (value !== "boolean" && value !== "number" && value !== "string" && value !== "symbol") {
      this.raise(FlowErrors.EnumInvalidExplicitType, this.state.startLoc, {
        enumName,
        invalidEnumType: value
      });
    }
    return value;
  }
  flowEnumBody(node, id) {
    const enumName = id.name;
    const nameLoc = id.loc.start;
    const explicitType = this.flowEnumParseExplicitType({
      enumName
    });
    this.expect(5);
    const {
      members,
      hasUnknownMembers
    } = this.flowEnumMembers({
      enumName,
      explicitType
    });
    node.hasUnknownMembers = hasUnknownMembers;
    switch (explicitType) {
      case "boolean":
        node.explicitType = true;
        node.members = members.booleanMembers;
        this.expect(8);
        return this.finishNode(node, "EnumBooleanBody");
      case "number":
        node.explicitType = true;
        node.members = members.numberMembers;
        this.expect(8);
        return this.finishNode(node, "EnumNumberBody");
      case "string":
        node.explicitType = true;
        node.members = this.flowEnumStringMembers(members.stringMembers, members.defaultedMembers, {
          enumName
        });
        this.expect(8);
        return this.finishNode(node, "EnumStringBody");
      case "symbol":
        node.members = members.defaultedMembers;
        this.expect(8);
        return this.finishNode(node, "EnumSymbolBody");
      default:
        {
          const empty = () => {
            node.members = [];
            this.expect(8);
            return this.finishNode(node, "EnumStringBody");
          };
          node.explicitType = false;
          const boolsLen = members.booleanMembers.length;
          const numsLen = members.numberMembers.length;
          const strsLen = members.stringMembers.length;
          const defaultedLen = members.defaultedMembers.length;
          if (!boolsLen && !numsLen && !strsLen && !defaultedLen) {
            return empty();
          } else if (!boolsLen && !numsLen) {
            node.members = this.flowEnumStringMembers(members.stringMembers, members.defaultedMembers, {
              enumName
            });
            this.expect(8);
            return this.finishNode(node, "EnumStringBody");
          } else if (!numsLen && !strsLen && boolsLen >= defaultedLen) {
            for (const member of members.defaultedMembers) {
              this.flowEnumErrorBooleanMemberNotInitialized(member.loc.start, {
                enumName,
                memberName: member.id.name
              });
            }
            node.members = members.booleanMembers;
            this.expect(8);
            return this.finishNode(node, "EnumBooleanBody");
          } else if (!boolsLen && !strsLen && numsLen >= defaultedLen) {
            for (const member of members.defaultedMembers) {
              this.flowEnumErrorNumberMemberNotInitialized(member.loc.start, {
                enumName,
                memberName: member.id.name
              });
            }
            node.members = members.numberMembers;
            this.expect(8);
            return this.finishNode(node, "EnumNumberBody");
          } else {
            this.raise(FlowErrors.EnumInconsistentMemberValues, nameLoc, {
              enumName
            });
            return empty();
          }
        }
    }
  }
  flowParseEnumDeclaration(node) {
    const id = this.parseIdentifier();
    node.id = id;
    node.body = this.flowEnumBody(this.startNode(), id);
    return this.finishNode(node, "EnumDeclaration");
  }
  jsxParseOpeningElementAfterName(node) {
    if (this.shouldParseTypes()) {
      if (this.match(47) || this.match(51)) {
        node.typeArguments = this.flowParseTypeParameterInstantiationInExpression();
      }
    }
    return super.jsxParseOpeningElementAfterName(node);
  }
  isLookaheadToken_lt() {
    const next = this.nextTokenStart();
    if (this.input.charCodeAt(next) === 60) {
      const afterNext = this.input.charCodeAt(next + 1);
      return afterNext !== 60 && afterNext !== 61;
    }
    return false;
  }
  reScan_lt_gt() {
    const {
      type
    } = this.state;
    if (type === 47) {
      this.state.pos -= 1;
      this.readToken_lt();
    } else if (type === 48) {
      this.state.pos -= 1;
      this.readToken_gt();
    }
  }
  reScan_lt() {
    const {
      type
    } = this.state;
    if (type === 51) {
      this.state.pos -= 2;
      this.finishOp(47, 1);
      return 47;
    }
    return type;
  }
  maybeUnwrapTypeCastExpression(node) {
    return node.type === "TypeCastExpression" ? node.expression : node;
  }
};
const entities = {
  __proto__: null,
  quot: "\u0022",
  amp: "&",
  apos: "\u0027",
  lt: "<",
  gt: ">",
  nbsp: "\u00A0",
  iexcl: "\u00A1",
  cent: "\u00A2",
  pound: "\u00A3",
  curren: "\u00A4",
  yen: "\u00A5",
  brvbar: "\u00A6",
  sect: "\u00A7",
  uml: "\u00A8",
  copy: "\u00A9",
  ordf: "\u00AA",
  laquo: "\u00AB",
  not: "\u00AC",
  shy: "\u00AD",
  reg: "\u00AE",
  macr: "\u00AF",
  deg: "\u00B0",
  plusmn: "\u00B1",
  sup2: "\u00B2",
  sup3: "\u00B3",
  acute: "\u00B4",
  micro: "\u00B5",
  para: "\u00B6",
  middot: "\u00B7",
  cedil: "\u00B8",
  sup1: "\u00B9",
  ordm: "\u00BA",
  raquo: "\u00BB",
  frac14: "\u00BC",
  frac12: "\u00BD",
  frac34: "\u00BE",
  iquest: "\u00BF",
  Agrave: "\u00C0",
  Aacute: "\u00C1",
  Acirc: "\u00C2",
  Atilde: "\u00C3",
  Auml: "\u00C4",
  Aring: "\u00C5",
  AElig: "\u00C6",
  Ccedil: "\u00C7",
  Egrave: "\u00C8",
  Eacute: "\u00C9",
  Ecirc: "\u00CA",
  Euml: "\u00CB",
  Igrave: "\u00CC",
  Iacute: "\u00CD",
  Icirc: "\u00CE",
  Iuml: "\u00CF",
  ETH: "\u00D0",
  Ntilde: "\u00D1",
  Ograve: "\u00D2",
  Oacute: "\u00D3",
  Ocirc: "\u00D4",
  Otilde: "\u00D5",
  Ouml: "\u00D6",
  times: "\u00D7",
  Oslash: "\u00D8",
  Ugrave: "\u00D9",
  Uacute: "\u00DA",
  Ucirc: "\u00DB",
  Uuml: "\u00DC",
  Yacute: "\u00DD",
  THORN: "\u00DE",
  szlig: "\u00DF",
  agrave: "\u00E0",
  aacute: "\u00E1",
  acirc: "\u00E2",
  atilde: "\u00E3",
  auml: "\u00E4",
  aring: "\u00E5",
  aelig: "\u00E6",
  ccedil: "\u00E7",
  egrave: "\u00E8",
  eacute: "\u00E9",
  ecirc: "\u00EA",
  euml: "\u00EB",
  igrave: "\u00EC",
  iacute: "\u00ED",
  icirc: "\u00EE",
  iuml: "\u00EF",
  eth: "\u00F0",
  ntilde: "\u00F1",
  ograve: "\u00F2",
  oacute: "\u00F3",
  ocirc: "\u00F4",
  otilde: "\u00F5",
  ouml: "\u00F6",
  divide: "\u00F7",
  oslash: "\u00F8",
  ugrave: "\u00F9",
  uacute: "\u00FA",
  ucirc: "\u00FB",
  uuml: "\u00FC",
  yacute: "\u00FD",
  thorn: "\u00FE",
  yuml: "\u00FF",
  OElig: "\u0152",
  oelig: "\u0153",
  Scaron: "\u0160",
  scaron: "\u0161",
  Yuml: "\u0178",
  fnof: "\u0192",
  circ: "\u02C6",
  tilde: "\u02DC",
  Alpha: "\u0391",
  Beta: "\u0392",
  Gamma: "\u0393",
  Delta: "\u0394",
  Epsilon: "\u0395",
  Zeta: "\u0396",
  Eta: "\u0397",
  Theta: "\u0398",
  Iota: "\u0399",
  Kappa: "\u039A",
  Lambda: "\u039B",
  Mu: "\u039C",
  Nu: "\u039D",
  Xi: "\u039E",
  Omicron: "\u039F",
  Pi: "\u03A0",
  Rho: "\u03A1",
  Sigma: "\u03A3",
  Tau: "\u03A4",
  Upsilon: "\u03A5",
  Phi: "\u03A6",
  Chi: "\u03A7",
  Psi: "\u03A8",
  Omega: "\u03A9",
  alpha: "\u03B1",
  beta: "\u03B2",
  gamma: "\u03B3",
  delta: "\u03B4",
  epsilon: "\u03B5",
  zeta: "\u03B6",
  eta: "\u03B7",
  theta: "\u03B8",
  iota: "\u03B9",
  kappa: "\u03BA",
  lambda: "\u03BB",
  mu: "\u03BC",
  nu: "\u03BD",
  xi: "\u03BE",
  omicron: "\u03BF",
  pi: "\u03C0",
  rho: "\u03C1",
  sigmaf: "\u03C2",
  sigma: "\u03C3",
  tau: "\u03C4",
  upsilon: "\u03C5",
  phi: "\u03C6",
  chi: "\u03C7",
  psi: "\u03C8",
  omega: "\u03C9",
  thetasym: "\u03D1",
  upsih: "\u03D2",
  piv: "\u03D6",
  ensp: "\u2002",
  emsp: "\u2003",
  thinsp: "\u2009",
  zwnj: "\u200C",
  zwj: "\u200D",
  lrm: "\u200E",
  rlm: "\u200F",
  ndash: "\u2013",
  mdash: "\u2014",
  lsquo: "\u2018",
  rsquo: "\u2019",
  sbquo: "\u201A",
  ldquo: "\u201C",
  rdquo: "\u201D",
  bdquo: "\u201E",
  dagger: "\u2020",
  Dagger: "\u2021",
  bull: "\u2022",
  hellip: "\u2026",
  permil: "\u2030",
  prime: "\u2032",
  Prime: "\u2033",
  lsaquo: "\u2039",
  rsaquo: "\u203A",
  oline: "\u203E",
  frasl: "\u2044",
  euro: "\u20AC",
  image: "\u2111",
  weierp: "\u2118",
  real: "\u211C",
  trade: "\u2122",
  alefsym: "\u2135",
  larr: "\u2190",
  uarr: "\u2191",
  rarr: "\u2192",
  darr: "\u2193",
  harr: "\u2194",
  crarr: "\u21B5",
  lArr: "\u21D0",
  uArr: "\u21D1",
  rArr: "\u21D2",
  dArr: "\u21D3",
  hArr: "\u21D4",
  forall: "\u2200",
  part: "\u2202",
  exist: "\u2203",
  empty: "\u2205",
  nabla: "\u2207",
  isin: "\u2208",
  notin: "\u2209",
  ni: "\u220B",
  prod: "\u220F",
  sum: "\u2211",
  minus: "\u2212",
  lowast: "\u2217",
  radic: "\u221A",
  prop: "\u221D",
  infin: "\u221E",
  ang: "\u2220",
  and: "\u2227",
  or: "\u2228",
  cap: "\u2229",
  cup: "\u222A",
  int: "\u222B",
  there4: "\u2234",
  sim: "\u223C",
  cong: "\u2245",
  asymp: "\u2248",
  ne: "\u2260",
  equiv: "\u2261",
  le: "\u2264",
  ge: "\u2265",
  sub: "\u2282",
  sup: "\u2283",
  nsub: "\u2284",
  sube: "\u2286",
  supe: "\u2287",
  oplus: "\u2295",
  otimes: "\u2297",
  perp: "\u22A5",
  sdot: "\u22C5",
  lceil: "\u2308",
  rceil: "\u2309",
  lfloor: "\u230A",
  rfloor: "\u230B",
  lang: "\u2329",
  rang: "\u232A",
  loz: "\u25CA",
  spades: "\u2660",
  clubs: "\u2663",
  hearts: "\u2665",
  diams: "\u2666"
};
const lineBreak = /\r\n|[\r\n\u2028\u2029]/;
const lineBreakG = new RegExp(lineBreak.source, "g");
function isNewLine(code) {
  switch (code) {
    case 10:
    case 13:
    case 8232:
    case 8233:
      return true;
    default:
      return false;
  }
}
function hasNewLine(input, start, end) {
  for (let i = start; i < end; i++) {
    if (isNewLine(input.charCodeAt(i))) {
      return true;
    }
  }
  return false;
}
const skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
const skipWhiteSpaceInLine = /(?:[^\S\n\r\u2028\u2029]|\/\/.*|\/\*.*?\*\/)*/g;
function isWhitespace(code) {
  switch (code) {
    case 0x0009:
    case 0x000b:
    case 0x000c:
    case 32:
    case 160:
    case 5760:
    case 0x2000:
    case 0x2001:
    case 0x2002:
    case 0x2003:
    case 0x2004:
    case 0x2005:
    case 0x2006:
    case 0x2007:
    case 0x2008:
    case 0x2009:
    case 0x200a:
    case 0x202f:
    case 0x205f:
    case 0x3000:
    case 0xfeff:
      return true;
    default:
      return false;
  }
}
const JsxErrors = ParseErrorEnum`jsx`({
  AttributeIsEmpty: "JSX attributes must only be assigned a non-empty expression.",
  MissingClosingTagElement: ({
    openingTagName
  }) => `Expected corresponding JSX closing tag for <${openingTagName}>.`,
  MissingClosingTagFragment: "Expected corresponding JSX closing tag for <>.",
  UnexpectedSequenceExpression: "Sequence expressions cannot be directly nested inside JSX. Did you mean to wrap it in parentheses (...)?",
  UnexpectedToken: ({
    unexpected,
    HTMLEntity
  }) => `Unexpected token \`${unexpected}\`. Did you mean \`${HTMLEntity}\` or \`{'${unexpected}'}\`?`,
  UnsupportedJsxValue: "JSX value should be either an expression or a quoted JSX text.",
  UnterminatedJsxContent: "Unterminated JSX contents.",
  UnwrappedAdjacentJSXElements: "Adjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?"
});
function isFragment(object) {
  return object ? object.type === "JSXOpeningFragment" || object.type === "JSXClosingFragment" : false;
}
function getQualifiedJSXName(object) {
  if (object.type === "JSXIdentifier") {
    return object.name;
  }
  if (object.type === "JSXNamespacedName") {
    return object.namespace.name + ":" + object.name.name;
  }
  if (object.type === "JSXMemberExpression") {
    return getQualifiedJSXName(object.object) + "." + getQualifiedJSXName(object.property);
  }
  throw new Error("Node had unexpected type: " + object.type);
}
var jsx = superClass => class JSXParserMixin extends superClass {
  jsxReadToken() {
    let out = "";
    let chunkStart = this.state.pos;
    for (;;) {
      if (this.state.pos >= this.length) {
        throw this.raise(JsxErrors.UnterminatedJsxContent, this.state.startLoc);
      }
      const ch = this.input.charCodeAt(this.state.pos);
      switch (ch) {
        case 60:
        case 123:
          if (this.state.pos === this.state.start) {
            if (ch === 60 && this.state.canStartJSXElement) {
              ++this.state.pos;
              this.finishToken(143);
            } else {
              super.getTokenFromCode(ch);
            }
            return;
          }
          out += this.input.slice(chunkStart, this.state.pos);
          this.finishToken(142, out);
          return;
        case 38:
          out += this.input.slice(chunkStart, this.state.pos);
          out += this.jsxReadEntity();
          chunkStart = this.state.pos;
          break;
        case 62:
        case 125:
        default:
          if (isNewLine(ch)) {
            out += this.input.slice(chunkStart, this.state.pos);
            out += this.jsxReadNewLine(true);
            chunkStart = this.state.pos;
          } else {
            ++this.state.pos;
          }
      }
    }
  }
  jsxReadNewLine(normalizeCRLF) {
    const ch = this.input.charCodeAt(this.state.pos);
    let out;
    ++this.state.pos;
    if (ch === 13 && this.input.charCodeAt(this.state.pos) === 10) {
      ++this.state.pos;
      out = normalizeCRLF ? "\n" : "\r\n";
    } else {
      out = String.fromCharCode(ch);
    }
    ++this.state.curLine;
    this.state.lineStart = this.state.pos;
    return out;
  }
  jsxReadString(quote) {
    let out = "";
    let chunkStart = ++this.state.pos;
    for (;;) {
      if (this.state.pos >= this.length) {
        throw this.raise(Errors.UnterminatedString, this.state.startLoc);
      }
      const ch = this.input.charCodeAt(this.state.pos);
      if (ch === quote) break;
      if (ch === 38) {
        out += this.input.slice(chunkStart, this.state.pos);
        out += this.jsxReadEntity();
        chunkStart = this.state.pos;
      } else if (isNewLine(ch)) {
        out += this.input.slice(chunkStart, this.state.pos);
        out += this.jsxReadNewLine(false);
        chunkStart = this.state.pos;
      } else {
        ++this.state.pos;
      }
    }
    out += this.input.slice(chunkStart, this.state.pos++);
    this.finishToken(134, out);
  }
  jsxReadEntity() {
    const startPos = ++this.state.pos;
    if (this.codePointAtPos(this.state.pos) === 35) {
      ++this.state.pos;
      let radix = 10;
      if (this.codePointAtPos(this.state.pos) === 120) {
        radix = 16;
        ++this.state.pos;
      }
      const codePoint = this.readInt(radix, undefined, false, "bail");
      if (codePoint !== null && this.codePointAtPos(this.state.pos) === 59) {
        ++this.state.pos;
        return String.fromCodePoint(codePoint);
      }
    } else {
      let count = 0;
      let semi = false;
      while (count++ < 10 && this.state.pos < this.length && !(semi = this.codePointAtPos(this.state.pos) === 59)) {
        ++this.state.pos;
      }
      if (semi) {
        const desc = this.input.slice(startPos, this.state.pos);
        const entity = entities[desc];
        ++this.state.pos;
        if (entity) {
          return entity;
        }
      }
    }
    this.state.pos = startPos;
    return "&";
  }
  jsxReadWord() {
    let ch;
    const start = this.state.pos;
    do {
      ch = this.input.charCodeAt(++this.state.pos);
    } while (isIdentifierChar(ch) || ch === 45);
    this.finishToken(141, this.input.slice(start, this.state.pos));
  }
  jsxParseIdentifier() {
    const node = this.startNode();
    if (this.match(141)) {
      node.name = this.state.value;
    } else if (tokenIsKeyword(this.state.type)) {
      node.name = tokenLabelName(this.state.type);
    } else {
      this.unexpected();
    }
    this.next();
    return this.finishNode(node, "JSXIdentifier");
  }
  jsxParseNamespacedName() {
    const startLoc = this.state.startLoc;
    const name = this.jsxParseIdentifier();
    if (!this.eat(14)) return name;
    const node = this.startNodeAt(startLoc);
    node.namespace = name;
    node.name = this.jsxParseIdentifier();
    return this.finishNode(node, "JSXNamespacedName");
  }
  jsxParseElementName() {
    const startLoc = this.state.startLoc;
    let node = this.jsxParseNamespacedName();
    if (node.type === "JSXNamespacedName") {
      return node;
    }
    while (this.eat(16)) {
      const newNode = this.startNodeAt(startLoc);
      newNode.object = node;
      newNode.property = this.jsxParseIdentifier();
      node = this.finishNode(newNode, "JSXMemberExpression");
    }
    return node;
  }
  jsxParseAttributeValue() {
    let node;
    switch (this.state.type) {
      case 5:
        node = this.startNode();
        this.setContext(types.brace);
        this.next();
        node = this.jsxParseExpressionContainer(node, types.j_oTag);
        if (node.expression.type === "JSXEmptyExpression") {
          this.raise(JsxErrors.AttributeIsEmpty, node);
        }
        return node;
      case 143:
      case 134:
        return this.parseExprAtom();
      default:
        throw this.raise(JsxErrors.UnsupportedJsxValue, this.state.startLoc);
    }
  }
  jsxParseEmptyExpression() {
    const node = this.startNodeAt(this.state.lastTokEndLoc);
    return this.finishNodeAt(node, "JSXEmptyExpression", this.state.startLoc);
  }
  jsxParseSpreadChild(node) {
    this.next();
    node.expression = this.parseExpression();
    this.setContext(types.j_expr);
    this.state.canStartJSXElement = true;
    this.expect(8);
    return this.finishNode(node, "JSXSpreadChild");
  }
  jsxParseExpressionContainer(node, previousContext) {
    if (this.match(8)) {
      node.expression = this.jsxParseEmptyExpression();
    } else {
      const expression = this.parseExpression();
      node.expression = expression;
    }
    this.setContext(previousContext);
    this.state.canStartJSXElement = true;
    this.expect(8);
    return this.finishNode(node, "JSXExpressionContainer");
  }
  jsxParseAttribute() {
    const node = this.startNode();
    if (this.match(5)) {
      this.setContext(types.brace);
      this.next();
      this.expect(21);
      node.argument = this.parseMaybeAssignAllowIn();
      this.setContext(types.j_oTag);
      this.state.canStartJSXElement = true;
      this.expect(8);
      return this.finishNode(node, "JSXSpreadAttribute");
    }
    node.name = this.jsxParseNamespacedName();
    node.value = this.eat(29) ? this.jsxParseAttributeValue() : null;
    return this.finishNode(node, "JSXAttribute");
  }
  jsxParseOpeningElementAt(startLoc) {
    const node = this.startNodeAt(startLoc);
    if (this.eat(144)) {
      return this.finishNode(node, "JSXOpeningFragment");
    }
    node.name = this.jsxParseElementName();
    return this.jsxParseOpeningElementAfterName(node);
  }
  jsxParseOpeningElementAfterName(node) {
    const attributes = [];
    while (!this.match(56) && !this.match(144)) {
      attributes.push(this.jsxParseAttribute());
    }
    node.attributes = attributes;
    node.selfClosing = this.eat(56);
    this.expect(144);
    return this.finishNode(node, "JSXOpeningElement");
  }
  jsxParseClosingElementAt(startLoc) {
    const node = this.startNodeAt(startLoc);
    if (this.eat(144)) {
      return this.finishNode(node, "JSXClosingFragment");
    }
    node.name = this.jsxParseElementName();
    this.expect(144);
    return this.finishNode(node, "JSXClosingElement");
  }
  jsxParseElementAt(startLoc) {
    const node = this.startNodeAt(startLoc);
    const children = [];
    const openingElement = this.jsxParseOpeningElementAt(startLoc);
    let closingElement = null;
    if (!openingElement.selfClosing) {
      contents: for (;;) {
        switch (this.state.type) {
          case 143:
            startLoc = this.state.startLoc;
            this.next();
            if (this.eat(56)) {
              closingElement = this.jsxParseClosingElementAt(startLoc);
              break contents;
            }
            children.push(this.jsxParseElementAt(startLoc));
            break;
          case 142:
            children.push(this.parseLiteral(this.state.value, "JSXText"));
            break;
          case 5:
            {
              const node = this.startNode();
              this.setContext(types.brace);
              this.next();
              if (this.match(21)) {
                children.push(this.jsxParseSpreadChild(node));
              } else {
                children.push(this.jsxParseExpressionContainer(node, types.j_expr));
              }
              break;
            }
          default:
            this.unexpected();
        }
      }
      if (isFragment(openingElement) && !isFragment(closingElement) && closingElement !== null) {
        this.raise(JsxErrors.MissingClosingTagFragment, closingElement);
      } else if (!isFragment(openingElement) && isFragment(closingElement)) {
        this.raise(JsxErrors.MissingClosingTagElement, closingElement, {
          openingTagName: getQualifiedJSXName(openingElement.name)
        });
      } else if (!isFragment(openingElement) && !isFragment(closingElement)) {
        if (getQualifiedJSXName(closingElement.name) !== getQualifiedJSXName(openingElement.name)) {
          this.raise(JsxErrors.MissingClosingTagElement, closingElement, {
            openingTagName: getQualifiedJSXName(openingElement.name)
          });
        }
      }
    }
    if (isFragment(openingElement)) {
      node.openingFragment = openingElement;
      node.closingFragment = closingElement;
    } else {
      node.openingElement = openingElement;
      node.closingElement = closingElement;
    }
    node.children = children;
    if (this.match(47)) {
      throw this.raise(JsxErrors.UnwrappedAdjacentJSXElements, this.state.startLoc);
    }
    return isFragment(openingElement) ? this.finishNode(node, "JSXFragment") : this.finishNode(node, "JSXElement");
  }
  jsxParseElement() {
    const startLoc = this.state.startLoc;
    this.next();
    return this.jsxParseElementAt(startLoc);
  }
  setContext(newContext) {
    const {
      context
    } = this.state;
    context[context.length - 1] = newContext;
  }
  parseExprAtom(refExpressionErrors) {
    if (this.match(143)) {
      return this.jsxParseElement();
    } else if (this.match(47) && this.input.charCodeAt(this.state.pos) !== 33) {
      this.replaceToken(143);
      return this.jsxParseElement();
    } else {
      return super.parseExprAtom(refExpressionErrors);
    }
  }
  skipSpace() {
    const curContext = this.curContext();
    if (!curContext.preserveSpace) super.skipSpace();
  }
  getTokenFromCode(code) {
    const context = this.curContext();
    if (context === types.j_expr) {
      this.jsxReadToken();
      return;
    }
    if (context === types.j_oTag || context === types.j_cTag) {
      if (isIdentifierStart(code)) {
        this.jsxReadWord();
        return;
      }
      if (code === 62) {
        ++this.state.pos;
        this.finishToken(144);
        return;
      }
      if ((code === 34 || code === 39) && context === types.j_oTag) {
        this.jsxReadString(code);
        return;
      }
    }
    if (code === 60 && this.state.canStartJSXElement && this.input.charCodeAt(this.state.pos + 1) !== 33) {
      ++this.state.pos;
      this.finishToken(143);
      return;
    }
    super.getTokenFromCode(code);
  }
  updateContext(prevType) {
    const {
      context,
      type
    } = this.state;
    if (type === 56 && prevType === 143) {
      context.splice(-2, 2, types.j_cTag);
      this.state.canStartJSXElement = false;
    } else if (type === 143) {
      context.push(types.j_oTag);
    } else if (type === 144) {
      const out = context[context.length - 1];
      if (out === types.j_oTag && prevType === 56 || out === types.j_cTag) {
        context.pop();
        this.state.canStartJSXElement = context[context.length - 1] === types.j_expr;
      } else {
        this.setContext(types.j_expr);
        this.state.canStartJSXElement = true;
      }
    } else {
      this.state.canStartJSXElement = tokenComesBeforeExpression(type);
    }
  }
};
class TypeScriptScope extends Scope {
  constructor(...args) {
    super(...args);
    this.tsNames = new Map();
  }
}
class TypeScriptScopeHandler extends ScopeHandler {
  constructor(...args) {
    super(...args);
    this.importsStack = [];
  }
  createScope(flags) {
    this.importsStack.push(new Set());
    return new TypeScriptScope(flags);
  }
  enter(flags) {
    if (flags === 1024) {
      this.importsStack.push(new Set());
    }
    super.enter(flags);
  }
  exit() {
    const flags = super.exit();
    if (flags === 1024) {
      this.importsStack.pop();
    }
    return flags;
  }
  hasImport(name, allowShadow) {
    const len = this.importsStack.length;
    if (this.importsStack[len - 1].has(name)) {
      return true;
    }
    if (!allowShadow && len > 1) {
      for (let i = 0; i < len - 1; i++) {
        if (this.importsStack[i].has(name)) return true;
      }
    }
    return false;
  }
  declareName(name, bindingType, loc) {
    if (bindingType & 4096) {
      if (this.hasImport(name, true)) {
        this.parser.raise(Errors.VarRedeclaration, loc, {
          identifierName: name
        });
      }
      this.importsStack[this.importsStack.length - 1].add(name);
      return;
    }
    const scope = this.currentScope();
    let type = scope.tsNames.get(name) || 0;
    if (bindingType & 1024) {
      this.maybeExportDefined(scope, name);
      scope.tsNames.set(name, type | 16);
      return;
    }
    super.declareName(name, bindingType, loc);
    if (bindingType & 2) {
      if (!(bindingType & 1)) {
        this.checkRedeclarationInScope(scope, name, bindingType, loc);
        this.maybeExportDefined(scope, name);
      }
      type = type | 1;
    }
    if (bindingType & 256) {
      type = type | 2;
    }
    if (bindingType & 512) {
      type = type | 4;
    }
    if (bindingType & 128) {
      type = type | 8;
    }
    if (type) scope.tsNames.set(name, type);
  }
  isRedeclaredInScope(scope, name, bindingType) {
    const type = scope.tsNames.get(name);
    if ((type & 2) > 0) {
      if (bindingType & 256) {
        const isConst = !!(bindingType & 512);
        const wasConst = (type & 4) > 0;
        return isConst !== wasConst;
      }
      return true;
    }
    if (bindingType & 128 && (type & 8) > 0) {
      if (scope.names.get(name) & 2) {
        return !!(bindingType & 1);
      } else {
        return false;
      }
    }
    if (bindingType & 2 && (type & 1) > 0) {
      return true;
    }
    return super.isRedeclaredInScope(scope, name, bindingType);
  }
  checkLocalExport(id) {
    const {
      name
    } = id;
    if (this.hasImport(name)) return;
    const len = this.scopeStack.length;
    for (let i = len - 1; i >= 0; i--) {
      const scope = this.scopeStack[i];
      const type = scope.tsNames.get(name);
      if ((type & 1) > 0 || (type & 16) > 0) {
        return;
      }
    }
    super.checkLocalExport(id);
  }
}
class ProductionParameterHandler {
  constructor() {
    this.stacks = [];
  }
  enter(flags) {
    this.stacks.push(flags);
  }
  exit() {
    this.stacks.pop();
  }
  currentFlags() {
    return this.stacks[this.stacks.length - 1];
  }
  get hasAwait() {
    return (this.currentFlags() & 2) > 0;
  }
  get hasYield() {
    return (this.currentFlags() & 1) > 0;
  }
  get hasReturn() {
    return (this.currentFlags() & 4) > 0;
  }
  get hasIn() {
    return (this.currentFlags() & 8) > 0;
  }
}
function functionFlags(isAsync, isGenerator) {
  return (isAsync ? 2 : 0) | (isGenerator ? 1 : 0);
}
class BaseParser {
  constructor() {
    this.sawUnambiguousESM = false;
    this.ambiguousScriptDifferentAst = false;
  }
  sourceToOffsetPos(sourcePos) {
    return sourcePos + this.startIndex;
  }
  offsetToSourcePos(offsetPos) {
    return offsetPos - this.startIndex;
  }
  hasPlugin(pluginConfig) {
    if (typeof pluginConfig === "string") {
      return this.plugins.has(pluginConfig);
    } else {
      const [pluginName, pluginOptions] = pluginConfig;
      if (!this.hasPlugin(pluginName)) {
        return false;
      }
      const actualOptions = this.plugins.get(pluginName);
      for (const key of Object.keys(pluginOptions)) {
        if ((actualOptions == null ? void 0 : actualOptions[key]) !== pluginOptions[key]) {
          return false;
        }
      }
      return true;
    }
  }
  getPluginOption(plugin, name) {
    var _this$plugins$get;
    return (_this$plugins$get = this.plugins.get(plugin)) == null ? void 0 : _this$plugins$get[name];
  }
}
function setTrailingComments(node, comments) {
  if (node.trailingComments === undefined) {
    node.trailingComments = comments;
  } else {
    node.trailingComments.unshift(...comments);
  }
}
function setLeadingComments(node, comments) {
  if (node.leadingComments === undefined) {
    node.leadingComments = comments;
  } else {
    node.leadingComments.unshift(...comments);
  }
}
function setInnerComments(node, comments) {
  if (node.innerComments === undefined) {
    node.innerComments = comments;
  } else {
    node.innerComments.unshift(...comments);
  }
}
function adjustInnerComments(node, elements, commentWS) {
  let lastElement = null;
  let i = elements.length;
  while (lastElement === null && i > 0) {
    lastElement = elements[--i];
  }
  if (lastElement === null || lastElement.start > commentWS.start) {
    setInnerComments(node, commentWS.comments);
  } else {
    setTrailingComments(lastElement, commentWS.comments);
  }
}
class CommentsParser extends BaseParser {
  addComment(comment) {
    if (this.filename) comment.loc.filename = this.filename;
    const {
      commentsLen
    } = this.state;
    if (this.comments.length !== commentsLen) {
      this.comments.length = commentsLen;
    }
    this.comments.push(comment);
    this.state.commentsLen++;
  }
  processComment(node) {
    const {
      commentStack
    } = this.state;
    const commentStackLength = commentStack.length;
    if (commentStackLength === 0) return;
    let i = commentStackLength - 1;
    const lastCommentWS = commentStack[i];
    if (lastCommentWS.start === node.end) {
      lastCommentWS.leadingNode = node;
      i--;
    }
    const {
      start: nodeStart
    } = node;
    for (; i >= 0; i--) {
      const commentWS = commentStack[i];
      const commentEnd = commentWS.end;
      if (commentEnd > nodeStart) {
        commentWS.containingNode = node;
        this.finalizeComment(commentWS);
        commentStack.splice(i, 1);
      } else {
        if (commentEnd === nodeStart) {
          commentWS.trailingNode = node;
        }
        break;
      }
    }
  }
  finalizeComment(commentWS) {
    var _node$options;
    const {
      comments
    } = commentWS;
    if (commentWS.leadingNode !== null || commentWS.trailingNode !== null) {
      if (commentWS.leadingNode !== null) {
        setTrailingComments(commentWS.leadingNode, comments);
      }
      if (commentWS.trailingNode !== null) {
        setLeadingComments(commentWS.trailingNode, comments);
      }
    } else {
      const node = commentWS.containingNode;
      const commentStart = commentWS.start;
      if (this.input.charCodeAt(this.offsetToSourcePos(commentStart) - 1) === 44) {
        switch (node.type) {
          case "ObjectExpression":
          case "ObjectPattern":
            adjustInnerComments(node, node.properties, commentWS);
            break;
          case "CallExpression":
          case "NewExpression":
          case "OptionalCallExpression":
            adjustInnerComments(node, node.arguments, commentWS);
            break;
          case "ImportExpression":
            adjustInnerComments(node, [node.source, (_node$options = node.options) != null ? _node$options : null], commentWS);
            break;
          case "FunctionDeclaration":
          case "FunctionExpression":
          case "ArrowFunctionExpression":
          case "ObjectMethod":
          case "ClassMethod":
          case "ClassPrivateMethod":
          case "TSTypeParameterDeclaration":
            adjustInnerComments(node, node.params, commentWS);
            break;
          case "ArrayExpression":
          case "ArrayPattern":
            adjustInnerComments(node, node.elements, commentWS);
            break;
          case "ExportNamedDeclaration":
          case "ImportDeclaration":
            adjustInnerComments(node, node.specifiers, commentWS);
            break;
          case "TSEnumDeclaration":
            adjustInnerComments(node, node.members, commentWS);
            break;
          case "TSEnumBody":
            adjustInnerComments(node, node.members, commentWS);
            break;
          case "TSInterfaceBody":
            adjustInnerComments(node, node.body, commentWS);
            break;
          default:
            {
              if (node.type === "RecordExpression") {
                adjustInnerComments(node, node.properties, commentWS);
                break;
              }
              if (node.type === "TupleExpression") {
                adjustInnerComments(node, node.elements, commentWS);
                break;
              }
              setInnerComments(node, comments);
            }
        }
      } else {
        setInnerComments(node, comments);
      }
    }
  }
  finalizeRemainingComments() {
    const {
      commentStack
    } = this.state;
    for (let i = commentStack.length - 1; i >= 0; i--) {
      this.finalizeComment(commentStack[i]);
    }
    this.state.commentStack = [];
  }
  resetPreviousNodeTrailingComments(node) {
    const {
      commentStack
    } = this.state;
    const {
      length
    } = commentStack;
    if (length === 0) return;
    const commentWS = commentStack[length - 1];
    if (commentWS.leadingNode === node) {
      commentWS.leadingNode = null;
    }
  }
  takeSurroundingComments(node, start, end) {
    const {
      commentStack
    } = this.state;
    const commentStackLength = commentStack.length;
    if (commentStackLength === 0) return;
    let i = commentStackLength - 1;
    for (; i >= 0; i--) {
      const commentWS = commentStack[i];
      const commentEnd = commentWS.end;
      const commentStart = commentWS.start;
      if (commentStart === end) {
        commentWS.leadingNode = node;
      } else if (commentEnd === start) {
        commentWS.trailingNode = node;
      } else if (commentEnd < start) {
        break;
      }
    }
  }
}
class State {
  constructor() {
    this.flags = 1024;
    this.startIndex = void 0;
    this.curLine = void 0;
    this.lineStart = void 0;
    this.startLoc = void 0;
    this.endLoc = void 0;
    this.errors = [];
    this.potentialArrowAt = -1;
    this.noArrowAt = [];
    this.noArrowParamsConversionAt = [];
    this.topicContext = {
      maxNumOfResolvableTopics: 0,
      maxTopicIndex: null
    };
    this.labels = [];
    this.commentsLen = 0;
    this.commentStack = [];
    this.pos = 0;
    this.type = 140;
    this.value = null;
    this.start = 0;
    this.end = 0;
    this.lastTokEndLoc = null;
    this.lastTokStartLoc = null;
    this.context = [types.brace];
    this.firstInvalidTemplateEscapePos = null;
    this.strictErrors = new Map();
    this.tokensLength = 0;
  }
  get strict() {
    return (this.flags & 1) > 0;
  }
  set strict(v) {
    if (v) this.flags |= 1;else this.flags &= -2;
  }
  init({
    strictMode,
    sourceType,
    startIndex,
    startLine,
    startColumn
  }) {
    this.strict = strictMode === false ? false : strictMode === true ? true : sourceType === "module";
    this.startIndex = startIndex;
    this.curLine = startLine;
    this.lineStart = -startColumn;
    this.startLoc = this.endLoc = new Position(startLine, startColumn, startIndex);
  }
  get maybeInArrowParameters() {
    return (this.flags & 2) > 0;
  }
  set maybeInArrowParameters(v) {
    if (v) this.flags |= 2;else this.flags &= -3;
  }
  get inType() {
    return (this.flags & 4) > 0;
  }
  set inType(v) {
    if (v) this.flags |= 4;else this.flags &= -5;
  }
  get noAnonFunctionType() {
    return (this.flags & 8) > 0;
  }
  set noAnonFunctionType(v) {
    if (v) this.flags |= 8;else this.flags &= -9;
  }
  get hasFlowComment() {
    return (this.flags & 16) > 0;
  }
  set hasFlowComment(v) {
    if (v) this.flags |= 16;else this.flags &= -17;
  }
  get isAmbientContext() {
    return (this.flags & 32) > 0;
  }
  set isAmbientContext(v) {
    if (v) this.flags |= 32;else this.flags &= -33;
  }
  get inAbstractClass() {
    return (this.flags & 64) > 0;
  }
  set inAbstractClass(v) {
    if (v) this.flags |= 64;else this.flags &= -65;
  }
  get inDisallowConditionalTypesContext() {
    return (this.flags & 128) > 0;
  }
  set inDisallowConditionalTypesContext(v) {
    if (v) this.flags |= 128;else this.flags &= -129;
  }
  get soloAwait() {
    return (this.flags & 256) > 0;
  }
  set soloAwait(v) {
    if (v) this.flags |= 256;else this.flags &= -257;
  }
  get inFSharpPipelineDirectBody() {
    return (this.flags & 512) > 0;
  }
  set inFSharpPipelineDirectBody(v) {
    if (v) this.flags |= 512;else this.flags &= -513;
  }
  get canStartJSXElement() {
    return (this.flags & 1024) > 0;
  }
  set canStartJSXElement(v) {
    if (v) this.flags |= 1024;else this.flags &= -1025;
  }
  get containsEsc() {
    return (this.flags & 2048) > 0;
  }
  set containsEsc(v) {
    if (v) this.flags |= 2048;else this.flags &= -2049;
  }
  get hasTopLevelAwait() {
    return (this.flags & 4096) > 0;
  }
  set hasTopLevelAwait(v) {
    if (v) this.flags |= 4096;else this.flags &= -4097;
  }
  curPosition() {
    return new Position(this.curLine, this.pos - this.lineStart, this.pos + this.startIndex);
  }
  clone() {
    const state = new State();
    state.flags = this.flags;
    state.startIndex = this.startIndex;
    state.curLine = this.curLine;
    state.lineStart = this.lineStart;
    state.startLoc = this.startLoc;
    state.endLoc = this.endLoc;
    state.errors = this.errors.slice();
    state.potentialArrowAt = this.potentialArrowAt;
    state.noArrowAt = this.noArrowAt.slice();
    state.noArrowParamsConversionAt = this.noArrowParamsConversionAt.slice();
    state.topicContext = this.topicContext;
    state.labels = this.labels.slice();
    state.commentsLen = this.commentsLen;
    state.commentStack = this.commentStack.slice();
    state.pos = this.pos;
    state.type = this.type;
    state.value = this.value;
    state.start = this.start;
    state.end = this.end;
    state.lastTokEndLoc = this.lastTokEndLoc;
    state.lastTokStartLoc = this.lastTokStartLoc;
    state.context = this.context.slice();
    state.firstInvalidTemplateEscapePos = this.firstInvalidTemplateEscapePos;
    state.strictErrors = this.strictErrors;
    state.tokensLength = this.tokensLength;
    return state;
  }
}
var _isDigit = function isDigit(code) {
  return code >= 48 && code <= 57;
};
const forbiddenNumericSeparatorSiblings = {
  decBinOct: new Set([46, 66, 69, 79, 95, 98, 101, 111]),
  hex: new Set([46, 88, 95, 120])
};
const isAllowedNumericSeparatorSibling = {
  bin: ch => ch === 48 || ch === 49,
  oct: ch => ch >= 48 && ch <= 55,
  dec: ch => ch >= 48 && ch <= 57,
  hex: ch => ch >= 48 && ch <= 57 || ch >= 65 && ch <= 70 || ch >= 97 && ch <= 102
};
function readStringContents(type, input, pos, lineStart, curLine, errors) {
  const initialPos = pos;
  const initialLineStart = lineStart;
  const initialCurLine = curLine;
  let out = "";
  let firstInvalidLoc = null;
  let chunkStart = pos;
  const {
    length
  } = input;
  for (;;) {
    if (pos >= length) {
      errors.unterminated(initialPos, initialLineStart, initialCurLine);
      out += input.slice(chunkStart, pos);
      break;
    }
    const ch = input.charCodeAt(pos);
    if (isStringEnd(type, ch, input, pos)) {
      out += input.slice(chunkStart, pos);
      break;
    }
    if (ch === 92) {
      out += input.slice(chunkStart, pos);
      const res = readEscapedChar(input, pos, lineStart, curLine, type === "template", errors);
      if (res.ch === null && !firstInvalidLoc) {
        firstInvalidLoc = {
          pos,
          lineStart,
          curLine
        };
      } else {
        out += res.ch;
      }
      ({
        pos,
        lineStart,
        curLine
      } = res);
      chunkStart = pos;
    } else if (ch === 8232 || ch === 8233) {
      ++pos;
      ++curLine;
      lineStart = pos;
    } else if (ch === 10 || ch === 13) {
      if (type === "template") {
        out += input.slice(chunkStart, pos) + "\n";
        ++pos;
        if (ch === 13 && input.charCodeAt(pos) === 10) {
          ++pos;
        }
        ++curLine;
        chunkStart = lineStart = pos;
      } else {
        errors.unterminated(initialPos, initialLineStart, initialCurLine);
      }
    } else {
      ++pos;
    }
  }
  return {
    pos,
    str: out,
    firstInvalidLoc,
    lineStart,
    curLine,
    containsInvalid: !!firstInvalidLoc
  };
}
function isStringEnd(type, ch, input, pos) {
  if (type === "template") {
    return ch === 96 || ch === 36 && input.charCodeAt(pos + 1) === 123;
  }
  return ch === (type === "double" ? 34 : 39);
}
function readEscapedChar(input, pos, lineStart, curLine, inTemplate, errors) {
  const throwOnInvalid = !inTemplate;
  pos++;
  const res = ch => ({
    pos,
    ch,
    lineStart,
    curLine
  });
  const ch = input.charCodeAt(pos++);
  switch (ch) {
    case 110:
      return res("\n");
    case 114:
      return res("\r");
    case 120:
      {
        let code;
        ({
          code,
          pos
        } = readHexChar(input, pos, lineStart, curLine, 2, false, throwOnInvalid, errors));
        return res(code === null ? null : String.fromCharCode(code));
      }
    case 117:
      {
        let code;
        ({
          code,
          pos
        } = readCodePoint(input, pos, lineStart, curLine, throwOnInvalid, errors));
        return res(code === null ? null : String.fromCodePoint(code));
      }
    case 116:
      return res("\t");
    case 98:
      return res("\b");
    case 118:
      return res("\u000b");
    case 102:
      return res("\f");
    case 13:
      if (input.charCodeAt(pos) === 10) {
        ++pos;
      }
    case 10:
      lineStart = pos;
      ++curLine;
    case 8232:
    case 8233:
      return res("");
    case 56:
    case 57:
      if (inTemplate) {
        return res(null);
      } else {
        errors.strictNumericEscape(pos - 1, lineStart, curLine);
      }
    default:
      if (ch >= 48 && ch <= 55) {
        const startPos = pos - 1;
        const match = /^[0-7]+/.exec(input.slice(startPos, pos + 2));
        let octalStr = match[0];
        let octal = parseInt(octalStr, 8);
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1);
          octal = parseInt(octalStr, 8);
        }
        pos += octalStr.length - 1;
        const next = input.charCodeAt(pos);
        if (octalStr !== "0" || next === 56 || next === 57) {
          if (inTemplate) {
            return res(null);
          } else {
            errors.strictNumericEscape(startPos, lineStart, curLine);
          }
        }
        return res(String.fromCharCode(octal));
      }
      return res(String.fromCharCode(ch));
  }
}
function readHexChar(input, pos, lineStart, curLine, len, forceLen, throwOnInvalid, errors) {
  const initialPos = pos;
  let n;
  ({
    n,
    pos
  } = readInt(input, pos, lineStart, curLine, 16, len, forceLen, false, errors, !throwOnInvalid));
  if (n === null) {
    if (throwOnInvalid) {
      errors.invalidEscapeSequence(initialPos, lineStart, curLine);
    } else {
      pos = initialPos - 1;
    }
  }
  return {
    code: n,
    pos
  };
}
function readInt(input, pos, lineStart, curLine, radix, len, forceLen, allowNumSeparator, errors, bailOnError) {
  const start = pos;
  const forbiddenSiblings = radix === 16 ? forbiddenNumericSeparatorSiblings.hex : forbiddenNumericSeparatorSiblings.decBinOct;
  const isAllowedSibling = radix === 16 ? isAllowedNumericSeparatorSibling.hex : radix === 10 ? isAllowedNumericSeparatorSibling.dec : radix === 8 ? isAllowedNumericSeparatorSibling.oct : isAllowedNumericSeparatorSibling.bin;
  let invalid = false;
  let total = 0;
  for (let i = 0, e = len == null ? Infinity : len; i < e; ++i) {
    const code = input.charCodeAt(pos);
    let val;
    if (code === 95 && allowNumSeparator !== "bail") {
      const prev = input.charCodeAt(pos - 1);
      const next = input.charCodeAt(pos + 1);
      if (!allowNumSeparator) {
        if (bailOnError) return {
          n: null,
          pos
        };
        errors.numericSeparatorInEscapeSequence(pos, lineStart, curLine);
      } else if (Number.isNaN(next) || !isAllowedSibling(next) || forbiddenSiblings.has(prev) || forbiddenSiblings.has(next)) {
        if (bailOnError) return {
          n: null,
          pos
        };
        errors.unexpectedNumericSeparator(pos, lineStart, curLine);
      }
      ++pos;
      continue;
    }
    if (code >= 97) {
      val = code - 97 + 10;
    } else if (code >= 65) {
      val = code - 65 + 10;
    } else if (_isDigit(code)) {
      val = code - 48;
    } else {
      val = Infinity;
    }
    if (val >= radix) {
      if (val <= 9 && bailOnError) {
        return {
          n: null,
          pos
        };
      } else if (val <= 9 && errors.invalidDigit(pos, lineStart, curLine, radix)) {
        val = 0;
      } else if (forceLen) {
        val = 0;
        invalid = true;
      } else {
        break;
      }
    }
    ++pos;
    total = total * radix + val;
  }
  if (pos === start || len != null && pos - start !== len || invalid) {
    return {
      n: null,
      pos
    };
  }
  return {
    n: total,
    pos
  };
}
function readCodePoint(input, pos, lineStart, curLine, throwOnInvalid, errors) {
  const ch = input.charCodeAt(pos);
  let code;
  if (ch === 123) {
    ++pos;
    ({
      code,
      pos
    } = readHexChar(input, pos, lineStart, curLine, input.indexOf("}", pos) - pos, true, throwOnInvalid, errors));
    ++pos;
    if (code !== null && code > 0x10ffff) {
      if (throwOnInvalid) {
        errors.invalidCodePoint(pos, lineStart, curLine);
      } else {
        return {
          code: null,
          pos
        };
      }
    }
  } else {
    ({
      code,
      pos
    } = readHexChar(input, pos, lineStart, curLine, 4, false, throwOnInvalid, errors));
  }
  return {
    code,
    pos
  };
}
function buildPosition(pos, lineStart, curLine) {
  return new Position(curLine, pos - lineStart, pos);
}
const VALID_REGEX_FLAGS = new Set([103, 109, 115, 105, 121, 117, 100, 118]);
class Token {
  constructor(state) {
    const startIndex = state.startIndex || 0;
    this.type = state.type;
    this.value = state.value;
    this.start = startIndex + state.start;
    this.end = startIndex + state.end;
    this.loc = new SourceLocation(state.startLoc, state.endLoc);
  }
}
class Tokenizer extends CommentsParser {
  constructor(options, input) {
    super();
    this.isLookahead = void 0;
    this.tokens = [];
    this.errorHandlers_readInt = {
      invalidDigit: (pos, lineStart, curLine, radix) => {
        if (!(this.optionFlags & 2048)) return false;
        this.raise(Errors.InvalidDigit, buildPosition(pos, lineStart, curLine), {
          radix
        });
        return true;
      },
      numericSeparatorInEscapeSequence: this.errorBuilder(Errors.NumericSeparatorInEscapeSequence),
      unexpectedNumericSeparator: this.errorBuilder(Errors.UnexpectedNumericSeparator)
    };
    this.errorHandlers_readCodePoint = Object.assign({}, this.errorHandlers_readInt, {
      invalidEscapeSequence: this.errorBuilder(Errors.InvalidEscapeSequence),
      invalidCodePoint: this.errorBuilder(Errors.InvalidCodePoint)
    });
    this.errorHandlers_readStringContents_string = Object.assign({}, this.errorHandlers_readCodePoint, {
      strictNumericEscape: (pos, lineStart, curLine) => {
        this.recordStrictModeErrors(Errors.StrictNumericEscape, buildPosition(pos, lineStart, curLine));
      },
      unterminated: (pos, lineStart, curLine) => {
        throw this.raise(Errors.UnterminatedString, buildPosition(pos - 1, lineStart, curLine));
      }
    });
    this.errorHandlers_readStringContents_template = Object.assign({}, this.errorHandlers_readCodePoint, {
      strictNumericEscape: this.errorBuilder(Errors.StrictNumericEscape),
      unterminated: (pos, lineStart, curLine) => {
        throw this.raise(Errors.UnterminatedTemplate, buildPosition(pos, lineStart, curLine));
      }
    });
    this.state = new State();
    this.state.init(options);
    this.input = input;
    this.length = input.length;
    this.comments = [];
    this.isLookahead = false;
  }
  pushToken(token) {
    this.tokens.length = this.state.tokensLength;
    this.tokens.push(token);
    ++this.state.tokensLength;
  }
  next() {
    this.checkKeywordEscapes();
    if (this.optionFlags & 256) {
      this.pushToken(new Token(this.state));
    }
    this.state.lastTokEndLoc = this.state.endLoc;
    this.state.lastTokStartLoc = this.state.startLoc;
    this.nextToken();
  }
  eat(type) {
    if (this.match(type)) {
      this.next();
      return true;
    } else {
      return false;
    }
  }
  match(type) {
    return this.state.type === type;
  }
  createLookaheadState(state) {
    return {
      pos: state.pos,
      value: null,
      type: state.type,
      start: state.start,
      end: state.end,
      context: [this.curContext()],
      inType: state.inType,
      startLoc: state.startLoc,
      lastTokEndLoc: state.lastTokEndLoc,
      curLine: state.curLine,
      lineStart: state.lineStart,
      curPosition: state.curPosition
    };
  }
  lookahead() {
    const old = this.state;
    this.state = this.createLookaheadState(old);
    this.isLookahead = true;
    this.nextToken();
    this.isLookahead = false;
    const curr = this.state;
    this.state = old;
    return curr;
  }
  nextTokenStart() {
    return this.nextTokenStartSince(this.state.pos);
  }
  nextTokenStartSince(pos) {
    skipWhiteSpace.lastIndex = pos;
    return skipWhiteSpace.test(this.input) ? skipWhiteSpace.lastIndex : pos;
  }
  lookaheadCharCode() {
    return this.lookaheadCharCodeSince(this.state.pos);
  }
  lookaheadCharCodeSince(pos) {
    return this.input.charCodeAt(this.nextTokenStartSince(pos));
  }
  nextTokenInLineStart() {
    return this.nextTokenInLineStartSince(this.state.pos);
  }
  nextTokenInLineStartSince(pos) {
    skipWhiteSpaceInLine.lastIndex = pos;
    return skipWhiteSpaceInLine.test(this.input) ? skipWhiteSpaceInLine.lastIndex : pos;
  }
  lookaheadInLineCharCode() {
    return this.input.charCodeAt(this.nextTokenInLineStart());
  }
  codePointAtPos(pos) {
    let cp = this.input.charCodeAt(pos);
    if ((cp & 0xfc00) === 0xd800 && ++pos < this.input.length) {
      const trail = this.input.charCodeAt(pos);
      if ((trail & 0xfc00) === 0xdc00) {
        cp = 0x10000 + ((cp & 0x3ff) << 10) + (trail & 0x3ff);
      }
    }
    return cp;
  }
  setStrict(strict) {
    this.state.strict = strict;
    if (strict) {
      this.state.strictErrors.forEach(([toParseError, at]) => this.raise(toParseError, at));
      this.state.strictErrors.clear();
    }
  }
  curContext() {
    return this.state.context[this.state.context.length - 1];
  }
  nextToken() {
    this.skipSpace();
    this.state.start = this.state.pos;
    if (!this.isLookahead) this.state.startLoc = this.state.curPosition();
    if (this.state.pos >= this.length) {
      this.finishToken(140);
      return;
    }
    this.getTokenFromCode(this.codePointAtPos(this.state.pos));
  }
  skipBlockComment(commentEnd) {
    let startLoc;
    if (!this.isLookahead) startLoc = this.state.curPosition();
    const start = this.state.pos;
    const end = this.input.indexOf(commentEnd, start + 2);
    if (end === -1) {
      throw this.raise(Errors.UnterminatedComment, this.state.curPosition());
    }
    this.state.pos = end + commentEnd.length;
    lineBreakG.lastIndex = start + 2;
    while (lineBreakG.test(this.input) && lineBreakG.lastIndex <= end) {
      ++this.state.curLine;
      this.state.lineStart = lineBreakG.lastIndex;
    }
    if (this.isLookahead) return;
    const comment = {
      type: "CommentBlock",
      value: this.input.slice(start + 2, end),
      start: this.sourceToOffsetPos(start),
      end: this.sourceToOffsetPos(end + commentEnd.length),
      loc: new SourceLocation(startLoc, this.state.curPosition())
    };
    if (this.optionFlags & 256) this.pushToken(comment);
    return comment;
  }
  skipLineComment(startSkip) {
    const start = this.state.pos;
    let startLoc;
    if (!this.isLookahead) startLoc = this.state.curPosition();
    let ch = this.input.charCodeAt(this.state.pos += startSkip);
    if (this.state.pos < this.length) {
      while (!isNewLine(ch) && ++this.state.pos < this.length) {
        ch = this.input.charCodeAt(this.state.pos);
      }
    }
    if (this.isLookahead) return;
    const end = this.state.pos;
    const value = this.input.slice(start + startSkip, end);
    const comment = {
      type: "CommentLine",
      value,
      start: this.sourceToOffsetPos(start),
      end: this.sourceToOffsetPos(end),
      loc: new SourceLocation(startLoc, this.state.curPosition())
    };
    if (this.optionFlags & 256) this.pushToken(comment);
    return comment;
  }
  skipSpace() {
    const spaceStart = this.state.pos;
    const comments = this.optionFlags & 4096 ? [] : null;
    loop: while (this.state.pos < this.length) {
      const ch = this.input.charCodeAt(this.state.pos);
      switch (ch) {
        case 32:
        case 160:
        case 9:
          ++this.state.pos;
          break;
        case 13:
          if (this.input.charCodeAt(this.state.pos + 1) === 10) {
            ++this.state.pos;
          }
        case 10:
        case 8232:
        case 8233:
          ++this.state.pos;
          ++this.state.curLine;
          this.state.lineStart = this.state.pos;
          break;
        case 47:
          switch (this.input.charCodeAt(this.state.pos + 1)) {
            case 42:
              {
                const comment = this.skipBlockComment("*/");
                if (comment !== undefined) {
                  this.addComment(comment);
                  comments == null || comments.push(comment);
                }
                break;
              }
            case 47:
              {
                const comment = this.skipLineComment(2);
                if (comment !== undefined) {
                  this.addComment(comment);
                  comments == null || comments.push(comment);
                }
                break;
              }
            default:
              break loop;
          }
          break;
        default:
          if (isWhitespace(ch)) {
            ++this.state.pos;
          } else if (ch === 45 && !this.inModule && this.optionFlags & 8192) {
            const pos = this.state.pos;
            if (this.input.charCodeAt(pos + 1) === 45 && this.input.charCodeAt(pos + 2) === 62 && (spaceStart === 0 || this.state.lineStart > spaceStart)) {
              const comment = this.skipLineComment(3);
              if (comment !== undefined) {
                this.addComment(comment);
                comments == null || comments.push(comment);
              }
            } else {
              break loop;
            }
          } else if (ch === 60 && !this.inModule && this.optionFlags & 8192) {
            const pos = this.state.pos;
            if (this.input.charCodeAt(pos + 1) === 33 && this.input.charCodeAt(pos + 2) === 45 && this.input.charCodeAt(pos + 3) === 45) {
              const comment = this.skipLineComment(4);
              if (comment !== undefined) {
                this.addComment(comment);
                comments == null || comments.push(comment);
              }
            } else {
              break loop;
            }
          } else {
            break loop;
          }
      }
    }
    if ((comments == null ? void 0 : comments.length) > 0) {
      const end = this.state.pos;
      const commentWhitespace = {
        start: this.sourceToOffsetPos(spaceStart),
        end: this.sourceToOffsetPos(end),
        comments: comments,
        leadingNode: null,
        trailingNode: null,
        containingNode: null
      };
      this.state.commentStack.push(commentWhitespace);
    }
  }
  finishToken(type, val) {
    this.state.end = this.state.pos;
    this.state.endLoc = this.state.curPosition();
    const prevType = this.state.type;
    this.state.type = type;
    this.state.value = val;
    if (!this.isLookahead) {
      this.updateContext(prevType);
    }
  }
  replaceToken(type) {
    this.state.type = type;
    this.updateContext();
  }
  readToken_numberSign() {
    if (this.state.pos === 0 && this.readToken_interpreter()) {
      return;
    }
    const nextPos = this.state.pos + 1;
    const next = this.codePointAtPos(nextPos);
    if (next >= 48 && next <= 57) {
      throw this.raise(Errors.UnexpectedDigitAfterHash, this.state.curPosition());
    }
    if (next === 123 || next === 91 && this.hasPlugin("recordAndTuple")) {
      this.expectPlugin("recordAndTuple");
      if (this.getPluginOption("recordAndTuple", "syntaxType") === "bar") {
        throw this.raise(next === 123 ? Errors.RecordExpressionHashIncorrectStartSyntaxType : Errors.TupleExpressionHashIncorrectStartSyntaxType, this.state.curPosition());
      }
      this.state.pos += 2;
      if (next === 123) {
        this.finishToken(7);
      } else {
        this.finishToken(1);
      }
    } else if (isIdentifierStart(next)) {
      ++this.state.pos;
      this.finishToken(139, this.readWord1(next));
    } else if (next === 92) {
      ++this.state.pos;
      this.finishToken(139, this.readWord1());
    } else {
      this.finishOp(27, 1);
    }
  }
  readToken_dot() {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next >= 48 && next <= 57) {
      this.readNumber(true);
      return;
    }
    if (next === 46 && this.input.charCodeAt(this.state.pos + 2) === 46) {
      this.state.pos += 3;
      this.finishToken(21);
    } else {
      ++this.state.pos;
      this.finishToken(16);
    }
  }
  readToken_slash() {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === 61) {
      this.finishOp(31, 2);
    } else {
      this.finishOp(56, 1);
    }
  }
  readToken_interpreter() {
    if (this.state.pos !== 0 || this.length < 2) return false;
    let ch = this.input.charCodeAt(this.state.pos + 1);
    if (ch !== 33) return false;
    const start = this.state.pos;
    this.state.pos += 1;
    while (!isNewLine(ch) && ++this.state.pos < this.length) {
      ch = this.input.charCodeAt(this.state.pos);
    }
    const value = this.input.slice(start + 2, this.state.pos);
    this.finishToken(28, value);
    return true;
  }
  readToken_mult_modulo(code) {
    let type = code === 42 ? 55 : 54;
    let width = 1;
    let next = this.input.charCodeAt(this.state.pos + 1);
    if (code === 42 && next === 42) {
      width++;
      next = this.input.charCodeAt(this.state.pos + 2);
      type = 57;
    }
    if (next === 61 && !this.state.inType) {
      width++;
      type = code === 37 ? 33 : 30;
    }
    this.finishOp(type, width);
  }
  readToken_pipe_amp(code) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === code) {
      if (this.input.charCodeAt(this.state.pos + 2) === 61) {
        this.finishOp(30, 3);
      } else {
        this.finishOp(code === 124 ? 41 : 42, 2);
      }
      return;
    }
    if (code === 124) {
      if (next === 62) {
        this.finishOp(39, 2);
        return;
      }
      if (this.hasPlugin("recordAndTuple") && next === 125) {
        if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
          throw this.raise(Errors.RecordExpressionBarIncorrectEndSyntaxType, this.state.curPosition());
        }
        this.state.pos += 2;
        this.finishToken(9);
        return;
      }
      if (this.hasPlugin("recordAndTuple") && next === 93) {
        if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
          throw this.raise(Errors.TupleExpressionBarIncorrectEndSyntaxType, this.state.curPosition());
        }
        this.state.pos += 2;
        this.finishToken(4);
        return;
      }
    }
    if (next === 61) {
      this.finishOp(30, 2);
      return;
    }
    this.finishOp(code === 124 ? 43 : 45, 1);
  }
  readToken_caret() {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === 61 && !this.state.inType) {
      this.finishOp(32, 2);
    } else if (next === 94 && this.hasPlugin(["pipelineOperator", {
      proposal: "hack",
      topicToken: "^^"
    }])) {
      this.finishOp(37, 2);
      const lookaheadCh = this.input.codePointAt(this.state.pos);
      if (lookaheadCh === 94) {
        this.unexpected();
      }
    } else {
      this.finishOp(44, 1);
    }
  }
  readToken_atSign() {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === 64 && this.hasPlugin(["pipelineOperator", {
      proposal: "hack",
      topicToken: "@@"
    }])) {
      this.finishOp(38, 2);
    } else {
      this.finishOp(26, 1);
    }
  }
  readToken_plus_min(code) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === code) {
      this.finishOp(34, 2);
      return;
    }
    if (next === 61) {
      this.finishOp(30, 2);
    } else {
      this.finishOp(53, 1);
    }
  }
  readToken_lt() {
    const {
      pos
    } = this.state;
    const next = this.input.charCodeAt(pos + 1);
    if (next === 60) {
      if (this.input.charCodeAt(pos + 2) === 61) {
        this.finishOp(30, 3);
        return;
      }
      this.finishOp(51, 2);
      return;
    }
    if (next === 61) {
      this.finishOp(49, 2);
      return;
    }
    this.finishOp(47, 1);
  }
  readToken_gt() {
    const {
      pos
    } = this.state;
    const next = this.input.charCodeAt(pos + 1);
    if (next === 62) {
      const size = this.input.charCodeAt(pos + 2) === 62 ? 3 : 2;
      if (this.input.charCodeAt(pos + size) === 61) {
        this.finishOp(30, size + 1);
        return;
      }
      this.finishOp(52, size);
      return;
    }
    if (next === 61) {
      this.finishOp(49, 2);
      return;
    }
    this.finishOp(48, 1);
  }
  readToken_eq_excl(code) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === 61) {
      this.finishOp(46, this.input.charCodeAt(this.state.pos + 2) === 61 ? 3 : 2);
      return;
    }
    if (code === 61 && next === 62) {
      this.state.pos += 2;
      this.finishToken(19);
      return;
    }
    this.finishOp(code === 61 ? 29 : 35, 1);
  }
  readToken_question() {
    const next = this.input.charCodeAt(this.state.pos + 1);
    const next2 = this.input.charCodeAt(this.state.pos + 2);
    if (next === 63) {
      if (next2 === 61) {
        this.finishOp(30, 3);
      } else {
        this.finishOp(40, 2);
      }
    } else if (next === 46 && !(next2 >= 48 && next2 <= 57)) {
      this.state.pos += 2;
      this.finishToken(18);
    } else {
      ++this.state.pos;
      this.finishToken(17);
    }
  }
  getTokenFromCode(code) {
    switch (code) {
      case 46:
        this.readToken_dot();
        return;
      case 40:
        ++this.state.pos;
        this.finishToken(10);
        return;
      case 41:
        ++this.state.pos;
        this.finishToken(11);
        return;
      case 59:
        ++this.state.pos;
        this.finishToken(13);
        return;
      case 44:
        ++this.state.pos;
        this.finishToken(12);
        return;
      case 91:
        if (this.hasPlugin("recordAndTuple") && this.input.charCodeAt(this.state.pos + 1) === 124) {
          if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
            throw this.raise(Errors.TupleExpressionBarIncorrectStartSyntaxType, this.state.curPosition());
          }
          this.state.pos += 2;
          this.finishToken(2);
        } else {
          ++this.state.pos;
          this.finishToken(0);
        }
        return;
      case 93:
        ++this.state.pos;
        this.finishToken(3);
        return;
      case 123:
        if (this.hasPlugin("recordAndTuple") && this.input.charCodeAt(this.state.pos + 1) === 124) {
          if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
            throw this.raise(Errors.RecordExpressionBarIncorrectStartSyntaxType, this.state.curPosition());
          }
          this.state.pos += 2;
          this.finishToken(6);
        } else {
          ++this.state.pos;
          this.finishToken(5);
        }
        return;
      case 125:
        ++this.state.pos;
        this.finishToken(8);
        return;
      case 58:
        if (this.hasPlugin("functionBind") && this.input.charCodeAt(this.state.pos + 1) === 58) {
          this.finishOp(15, 2);
        } else {
          ++this.state.pos;
          this.finishToken(14);
        }
        return;
      case 63:
        this.readToken_question();
        return;
      case 96:
        this.readTemplateToken();
        return;
      case 48:
        {
          const next = this.input.charCodeAt(this.state.pos + 1);
          if (next === 120 || next === 88) {
            this.readRadixNumber(16);
            return;
          }
          if (next === 111 || next === 79) {
            this.readRadixNumber(8);
            return;
          }
          if (next === 98 || next === 66) {
            this.readRadixNumber(2);
            return;
          }
        }
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        this.readNumber(false);
        return;
      case 34:
      case 39:
        this.readString(code);
        return;
      case 47:
        this.readToken_slash();
        return;
      case 37:
      case 42:
        this.readToken_mult_modulo(code);
        return;
      case 124:
      case 38:
        this.readToken_pipe_amp(code);
        return;
      case 94:
        this.readToken_caret();
        return;
      case 43:
      case 45:
        this.readToken_plus_min(code);
        return;
      case 60:
        this.readToken_lt();
        return;
      case 62:
        this.readToken_gt();
        return;
      case 61:
      case 33:
        this.readToken_eq_excl(code);
        return;
      case 126:
        this.finishOp(36, 1);
        return;
      case 64:
        this.readToken_atSign();
        return;
      case 35:
        this.readToken_numberSign();
        return;
      case 92:
        this.readWord();
        return;
      default:
        if (isIdentifierStart(code)) {
          this.readWord(code);
          return;
        }
    }
    throw this.raise(Errors.InvalidOrUnexpectedToken, this.state.curPosition(), {
      unexpected: String.fromCodePoint(code)
    });
  }
  finishOp(type, size) {
    const str = this.input.slice(this.state.pos, this.state.pos + size);
    this.state.pos += size;
    this.finishToken(type, str);
  }
  readRegexp() {
    const startLoc = this.state.startLoc;
    const start = this.state.start + 1;
    let escaped, inClass;
    let {
      pos
    } = this.state;
    for (;; ++pos) {
      if (pos >= this.length) {
        throw this.raise(Errors.UnterminatedRegExp, createPositionWithColumnOffset(startLoc, 1));
      }
      const ch = this.input.charCodeAt(pos);
      if (isNewLine(ch)) {
        throw this.raise(Errors.UnterminatedRegExp, createPositionWithColumnOffset(startLoc, 1));
      }
      if (escaped) {
        escaped = false;
      } else {
        if (ch === 91) {
          inClass = true;
        } else if (ch === 93 && inClass) {
          inClass = false;
        } else if (ch === 47 && !inClass) {
          break;
        }
        escaped = ch === 92;
      }
    }
    const content = this.input.slice(start, pos);
    ++pos;
    let mods = "";
    const nextPos = () => createPositionWithColumnOffset(startLoc, pos + 2 - start);
    while (pos < this.length) {
      const cp = this.codePointAtPos(pos);
      const char = String.fromCharCode(cp);
      if (VALID_REGEX_FLAGS.has(cp)) {
        if (cp === 118) {
          if (mods.includes("u")) {
            this.raise(Errors.IncompatibleRegExpUVFlags, nextPos());
          }
        } else if (cp === 117) {
          if (mods.includes("v")) {
            this.raise(Errors.IncompatibleRegExpUVFlags, nextPos());
          }
        }
        if (mods.includes(char)) {
          this.raise(Errors.DuplicateRegExpFlags, nextPos());
        }
      } else if (isIdentifierChar(cp) || cp === 92) {
        this.raise(Errors.MalformedRegExpFlags, nextPos());
      } else {
        break;
      }
      ++pos;
      mods += char;
    }
    this.state.pos = pos;
    this.finishToken(138, {
      pattern: content,
      flags: mods
    });
  }
  readInt(radix, len, forceLen = false, allowNumSeparator = true) {
    const {
      n,
      pos
    } = readInt(this.input, this.state.pos, this.state.lineStart, this.state.curLine, radix, len, forceLen, allowNumSeparator, this.errorHandlers_readInt, false);
    this.state.pos = pos;
    return n;
  }
  readRadixNumber(radix) {
    const start = this.state.pos;
    const startLoc = this.state.curPosition();
    let isBigInt = false;
    this.state.pos += 2;
    const val = this.readInt(radix);
    if (val == null) {
      this.raise(Errors.InvalidDigit, createPositionWithColumnOffset(startLoc, 2), {
        radix
      });
    }
    const next = this.input.charCodeAt(this.state.pos);
    if (next === 110) {
      ++this.state.pos;
      isBigInt = true;
    } else if (next === 109) {
      throw this.raise(Errors.InvalidDecimal, startLoc);
    }
    if (isIdentifierStart(this.codePointAtPos(this.state.pos))) {
      throw this.raise(Errors.NumberIdentifier, this.state.curPosition());
    }
    if (isBigInt) {
      const str = this.input.slice(start, this.state.pos).replace(/[_n]/g, "");
      this.finishToken(136, str);
      return;
    }
    this.finishToken(135, val);
  }
  readNumber(startsWithDot) {
    const start = this.state.pos;
    const startLoc = this.state.curPosition();
    let isFloat = false;
    let isBigInt = false;
    let hasExponent = false;
    let isOctal = false;
    if (!startsWithDot && this.readInt(10) === null) {
      this.raise(Errors.InvalidNumber, this.state.curPosition());
    }
    const hasLeadingZero = this.state.pos - start >= 2 && this.input.charCodeAt(start) === 48;
    if (hasLeadingZero) {
      const integer = this.input.slice(start, this.state.pos);
      this.recordStrictModeErrors(Errors.StrictOctalLiteral, startLoc);
      if (!this.state.strict) {
        const underscorePos = integer.indexOf("_");
        if (underscorePos > 0) {
          this.raise(Errors.ZeroDigitNumericSeparator, createPositionWithColumnOffset(startLoc, underscorePos));
        }
      }
      isOctal = hasLeadingZero && !/[89]/.test(integer);
    }
    let next = this.input.charCodeAt(this.state.pos);
    if (next === 46 && !isOctal) {
      ++this.state.pos;
      this.readInt(10);
      isFloat = true;
      next = this.input.charCodeAt(this.state.pos);
    }
    if ((next === 69 || next === 101) && !isOctal) {
      next = this.input.charCodeAt(++this.state.pos);
      if (next === 43 || next === 45) {
        ++this.state.pos;
      }
      if (this.readInt(10) === null) {
        this.raise(Errors.InvalidOrMissingExponent, startLoc);
      }
      isFloat = true;
      hasExponent = true;
      next = this.input.charCodeAt(this.state.pos);
    }
    if (next === 110) {
      if (isFloat || hasLeadingZero) {
        this.raise(Errors.InvalidBigIntLiteral, startLoc);
      }
      ++this.state.pos;
      isBigInt = true;
    }
    if (next === 109) {
      this.expectPlugin("decimal", this.state.curPosition());
      if (hasExponent || hasLeadingZero) {
        this.raise(Errors.InvalidDecimal, startLoc);
      }
      ++this.state.pos;
      var isDecimal = true;
    }
    if (isIdentifierStart(this.codePointAtPos(this.state.pos))) {
      throw this.raise(Errors.NumberIdentifier, this.state.curPosition());
    }
    const str = this.input.slice(start, this.state.pos).replace(/[_mn]/g, "");
    if (isBigInt) {
      this.finishToken(136, str);
      return;
    }
    if (isDecimal) {
      this.finishToken(137, str);
      return;
    }
    const val = isOctal ? parseInt(str, 8) : parseFloat(str);
    this.finishToken(135, val);
  }
  readCodePoint(throwOnInvalid) {
    const {
      code,
      pos
    } = readCodePoint(this.input, this.state.pos, this.state.lineStart, this.state.curLine, throwOnInvalid, this.errorHandlers_readCodePoint);
    this.state.pos = pos;
    return code;
  }
  readString(quote) {
    const {
      str,
      pos,
      curLine,
      lineStart
    } = readStringContents(quote === 34 ? "double" : "single", this.input, this.state.pos + 1, this.state.lineStart, this.state.curLine, this.errorHandlers_readStringContents_string);
    this.state.pos = pos + 1;
    this.state.lineStart = lineStart;
    this.state.curLine = curLine;
    this.finishToken(134, str);
  }
  readTemplateContinuation() {
    if (!this.match(8)) {
      this.unexpected(null, 8);
    }
    this.state.pos--;
    this.readTemplateToken();
  }
  readTemplateToken() {
    const opening = this.input[this.state.pos];
    const {
      str,
      firstInvalidLoc,
      pos,
      curLine,
      lineStart
    } = readStringContents("template", this.input, this.state.pos + 1, this.state.lineStart, this.state.curLine, this.errorHandlers_readStringContents_template);
    this.state.pos = pos + 1;
    this.state.lineStart = lineStart;
    this.state.curLine = curLine;
    if (firstInvalidLoc) {
      this.state.firstInvalidTemplateEscapePos = new Position(firstInvalidLoc.curLine, firstInvalidLoc.pos - firstInvalidLoc.lineStart, this.sourceToOffsetPos(firstInvalidLoc.pos));
    }
    if (this.input.codePointAt(pos) === 96) {
      this.finishToken(24, firstInvalidLoc ? null : opening + str + "`");
    } else {
      this.state.pos++;
      this.finishToken(25, firstInvalidLoc ? null : opening + str + "${");
    }
  }
  recordStrictModeErrors(toParseError, at) {
    const index = at.index;
    if (this.state.strict && !this.state.strictErrors.has(index)) {
      this.raise(toParseError, at);
    } else {
      this.state.strictErrors.set(index, [toParseError, at]);
    }
  }
  readWord1(firstCode) {
    this.state.containsEsc = false;
    let word = "";
    const start = this.state.pos;
    let chunkStart = this.state.pos;
    if (firstCode !== undefined) {
      this.state.pos += firstCode <= 0xffff ? 1 : 2;
    }
    while (this.state.pos < this.length) {
      const ch = this.codePointAtPos(this.state.pos);
      if (isIdentifierChar(ch)) {
        this.state.pos += ch <= 0xffff ? 1 : 2;
      } else if (ch === 92) {
        this.state.containsEsc = true;
        word += this.input.slice(chunkStart, this.state.pos);
        const escStart = this.state.curPosition();
        const identifierCheck = this.state.pos === start ? isIdentifierStart : isIdentifierChar;
        if (this.input.charCodeAt(++this.state.pos) !== 117) {
          this.raise(Errors.MissingUnicodeEscape, this.state.curPosition());
          chunkStart = this.state.pos - 1;
          continue;
        }
        ++this.state.pos;
        const esc = this.readCodePoint(true);
        if (esc !== null) {
          if (!identifierCheck(esc)) {
            this.raise(Errors.EscapedCharNotAnIdentifier, escStart);
          }
          word += String.fromCodePoint(esc);
        }
        chunkStart = this.state.pos;
      } else {
        break;
      }
    }
    return word + this.input.slice(chunkStart, this.state.pos);
  }
  readWord(firstCode) {
    const word = this.readWord1(firstCode);
    const type = keywords$1.get(word);
    if (type !== undefined) {
      this.finishToken(type, tokenLabelName(type));
    } else {
      this.finishToken(132, word);
    }
  }
  checkKeywordEscapes() {
    const {
      type
    } = this.state;
    if (tokenIsKeyword(type) && this.state.containsEsc) {
      this.raise(Errors.InvalidEscapedReservedWord, this.state.startLoc, {
        reservedWord: tokenLabelName(type)
      });
    }
  }
  raise(toParseError, at, details = {}) {
    const loc = at instanceof Position ? at : at.loc.start;
    const error = toParseError(loc, details);
    if (!(this.optionFlags & 2048)) throw error;
    if (!this.isLookahead) this.state.errors.push(error);
    return error;
  }
  raiseOverwrite(toParseError, at, details = {}) {
    const loc = at instanceof Position ? at : at.loc.start;
    const pos = loc.index;
    const errors = this.state.errors;
    for (let i = errors.length - 1; i >= 0; i--) {
      const error = errors[i];
      if (error.loc.index === pos) {
        return errors[i] = toParseError(loc, details);
      }
      if (error.loc.index < pos) break;
    }
    return this.raise(toParseError, at, details);
  }
  updateContext(prevType) {}
  unexpected(loc, type) {
    throw this.raise(Errors.UnexpectedToken, loc != null ? loc : this.state.startLoc, {
      expected: type ? tokenLabelName(type) : null
    });
  }
  expectPlugin(pluginName, loc) {
    if (this.hasPlugin(pluginName)) {
      return true;
    }
    throw this.raise(Errors.MissingPlugin, loc != null ? loc : this.state.startLoc, {
      missingPlugin: [pluginName]
    });
  }
  expectOnePlugin(pluginNames) {
    if (!pluginNames.some(name => this.hasPlugin(name))) {
      throw this.raise(Errors.MissingOneOfPlugins, this.state.startLoc, {
        missingPlugin: pluginNames
      });
    }
  }
  errorBuilder(error) {
    return (pos, lineStart, curLine) => {
      this.raise(error, buildPosition(pos, lineStart, curLine));
    };
  }
}
class ClassScope {
  constructor() {
    this.privateNames = new Set();
    this.loneAccessors = new Map();
    this.undefinedPrivateNames = new Map();
  }
}
class ClassScopeHandler {
  constructor(parser) {
    this.parser = void 0;
    this.stack = [];
    this.undefinedPrivateNames = new Map();
    this.parser = parser;
  }
  current() {
    return this.stack[this.stack.length - 1];
  }
  enter() {
    this.stack.push(new ClassScope());
  }
  exit() {
    const oldClassScope = this.stack.pop();
    const current = this.current();
    for (const [name, loc] of Array.from(oldClassScope.undefinedPrivateNames)) {
      if (current) {
        if (!current.undefinedPrivateNames.has(name)) {
          current.undefinedPrivateNames.set(name, loc);
        }
      } else {
        this.parser.raise(Errors.InvalidPrivateFieldResolution, loc, {
          identifierName: name
        });
      }
    }
  }
  declarePrivateName(name, elementType, loc) {
    const {
      privateNames,
      loneAccessors,
      undefinedPrivateNames
    } = this.current();
    let redefined = privateNames.has(name);
    if (elementType & 3) {
      const accessor = redefined && loneAccessors.get(name);
      if (accessor) {
        const oldStatic = accessor & 4;
        const newStatic = elementType & 4;
        const oldKind = accessor & 3;
        const newKind = elementType & 3;
        redefined = oldKind === newKind || oldStatic !== newStatic;
        if (!redefined) loneAccessors.delete(name);
      } else if (!redefined) {
        loneAccessors.set(name, elementType);
      }
    }
    if (redefined) {
      this.parser.raise(Errors.PrivateNameRedeclaration, loc, {
        identifierName: name
      });
    }
    privateNames.add(name);
    undefinedPrivateNames.delete(name);
  }
  usePrivateName(name, loc) {
    let classScope;
    for (classScope of this.stack) {
      if (classScope.privateNames.has(name)) return;
    }
    if (classScope) {
      classScope.undefinedPrivateNames.set(name, loc);
    } else {
      this.parser.raise(Errors.InvalidPrivateFieldResolution, loc, {
        identifierName: name
      });
    }
  }
}
class ExpressionScope {
  constructor(type = 0) {
    this.type = type;
  }
  canBeArrowParameterDeclaration() {
    return this.type === 2 || this.type === 1;
  }
  isCertainlyParameterDeclaration() {
    return this.type === 3;
  }
}
class ArrowHeadParsingScope extends ExpressionScope {
  constructor(type) {
    super(type);
    this.declarationErrors = new Map();
  }
  recordDeclarationError(ParsingErrorClass, at) {
    const index = at.index;
    this.declarationErrors.set(index, [ParsingErrorClass, at]);
  }
  clearDeclarationError(index) {
    this.declarationErrors.delete(index);
  }
  iterateErrors(iterator) {
    this.declarationErrors.forEach(iterator);
  }
}
class ExpressionScopeHandler {
  constructor(parser) {
    this.parser = void 0;
    this.stack = [new ExpressionScope()];
    this.parser = parser;
  }
  enter(scope) {
    this.stack.push(scope);
  }
  exit() {
    this.stack.pop();
  }
  recordParameterInitializerError(toParseError, node) {
    const origin = node.loc.start;
    const {
      stack
    } = this;
    let i = stack.length - 1;
    let scope = stack[i];
    while (!scope.isCertainlyParameterDeclaration()) {
      if (scope.canBeArrowParameterDeclaration()) {
        scope.recordDeclarationError(toParseError, origin);
      } else {
        return;
      }
      scope = stack[--i];
    }
    this.parser.raise(toParseError, origin);
  }
  recordArrowParameterBindingError(error, node) {
    const {
      stack
    } = this;
    const scope = stack[stack.length - 1];
    const origin = node.loc.start;
    if (scope.isCertainlyParameterDeclaration()) {
      this.parser.raise(error, origin);
    } else if (scope.canBeArrowParameterDeclaration()) {
      scope.recordDeclarationError(error, origin);
    } else {
      return;
    }
  }
  recordAsyncArrowParametersError(at) {
    const {
      stack
    } = this;
    let i = stack.length - 1;
    let scope = stack[i];
    while (scope.canBeArrowParameterDeclaration()) {
      if (scope.type === 2) {
        scope.recordDeclarationError(Errors.AwaitBindingIdentifier, at);
      }
      scope = stack[--i];
    }
  }
  validateAsPattern() {
    const {
      stack
    } = this;
    const currentScope = stack[stack.length - 1];
    if (!currentScope.canBeArrowParameterDeclaration()) return;
    currentScope.iterateErrors(([toParseError, loc]) => {
      this.parser.raise(toParseError, loc);
      let i = stack.length - 2;
      let scope = stack[i];
      while (scope.canBeArrowParameterDeclaration()) {
        scope.clearDeclarationError(loc.index);
        scope = stack[--i];
      }
    });
  }
}
function newParameterDeclarationScope() {
  return new ExpressionScope(3);
}
function newArrowHeadScope() {
  return new ArrowHeadParsingScope(1);
}
function newAsyncArrowScope() {
  return new ArrowHeadParsingScope(2);
}
function newExpressionScope() {
  return new ExpressionScope();
}
class UtilParser extends Tokenizer {
  addExtra(node, key, value, enumerable = true) {
    if (!node) return;
    let {
      extra
    } = node;
    if (extra == null) {
      extra = {};
      node.extra = extra;
    }
    if (enumerable) {
      extra[key] = value;
    } else {
      Object.defineProperty(extra, key, {
        enumerable,
        value
      });
    }
  }
  isContextual(token) {
    return this.state.type === token && !this.state.containsEsc;
  }
  isUnparsedContextual(nameStart, name) {
    if (this.input.startsWith(name, nameStart)) {
      const nextCh = this.input.charCodeAt(nameStart + name.length);
      return !(isIdentifierChar(nextCh) || (nextCh & 0xfc00) === 0xd800);
    }
    return false;
  }
  isLookaheadContextual(name) {
    const next = this.nextTokenStart();
    return this.isUnparsedContextual(next, name);
  }
  eatContextual(token) {
    if (this.isContextual(token)) {
      this.next();
      return true;
    }
    return false;
  }
  expectContextual(token, toParseError) {
    if (!this.eatContextual(token)) {
      if (toParseError != null) {
        throw this.raise(toParseError, this.state.startLoc);
      }
      this.unexpected(null, token);
    }
  }
  canInsertSemicolon() {
    return this.match(140) || this.match(8) || this.hasPrecedingLineBreak();
  }
  hasPrecedingLineBreak() {
    return hasNewLine(this.input, this.offsetToSourcePos(this.state.lastTokEndLoc.index), this.state.start);
  }
  hasFollowingLineBreak() {
    return hasNewLine(this.input, this.state.end, this.nextTokenStart());
  }
  isLineTerminator() {
    return this.eat(13) || this.canInsertSemicolon();
  }
  semicolon(allowAsi = true) {
    if (allowAsi ? this.isLineTerminator() : this.eat(13)) return;
    this.raise(Errors.MissingSemicolon, this.state.lastTokEndLoc);
  }
  expect(type, loc) {
    if (!this.eat(type)) {
      this.unexpected(loc, type);
    }
  }
  tryParse(fn, oldState = this.state.clone()) {
    const abortSignal = {
      node: null
    };
    try {
      const node = fn((node = null) => {
        abortSignal.node = node;
        throw abortSignal;
      });
      if (this.state.errors.length > oldState.errors.length) {
        const failState = this.state;
        this.state = oldState;
        this.state.tokensLength = failState.tokensLength;
        return {
          node,
          error: failState.errors[oldState.errors.length],
          thrown: false,
          aborted: false,
          failState
        };
      }
      return {
        node: node,
        error: null,
        thrown: false,
        aborted: false,
        failState: null
      };
    } catch (error) {
      const failState = this.state;
      this.state = oldState;
      if (error instanceof SyntaxError) {
        return {
          node: null,
          error,
          thrown: true,
          aborted: false,
          failState
        };
      }
      if (error === abortSignal) {
        return {
          node: abortSignal.node,
          error: null,
          thrown: false,
          aborted: true,
          failState
        };
      }
      throw error;
    }
  }
  checkExpressionErrors(refExpressionErrors, andThrow) {
    if (!refExpressionErrors) return false;
    const {
      shorthandAssignLoc,
      doubleProtoLoc,
      privateKeyLoc,
      optionalParametersLoc,
      voidPatternLoc
    } = refExpressionErrors;
    const hasErrors = !!shorthandAssignLoc || !!doubleProtoLoc || !!optionalParametersLoc || !!privateKeyLoc || !!voidPatternLoc;
    if (!andThrow) {
      return hasErrors;
    }
    if (shorthandAssignLoc != null) {
      this.raise(Errors.InvalidCoverInitializedName, shorthandAssignLoc);
    }
    if (doubleProtoLoc != null) {
      this.raise(Errors.DuplicateProto, doubleProtoLoc);
    }
    if (privateKeyLoc != null) {
      this.raise(Errors.UnexpectedPrivateField, privateKeyLoc);
    }
    if (optionalParametersLoc != null) {
      this.unexpected(optionalParametersLoc);
    }
    if (voidPatternLoc != null) {
      this.raise(Errors.InvalidCoverDiscardElement, voidPatternLoc);
    }
  }
  isLiteralPropertyName() {
    return tokenIsLiteralPropertyName(this.state.type);
  }
  isPrivateName(node) {
    return node.type === "PrivateName";
  }
  getPrivateNameSV(node) {
    return node.id.name;
  }
  hasPropertyAsPrivateName(node) {
    return (node.type === "MemberExpression" || node.type === "OptionalMemberExpression") && this.isPrivateName(node.property);
  }
  isObjectProperty(node) {
    return node.type === "ObjectProperty";
  }
  isObjectMethod(node) {
    return node.type === "ObjectMethod";
  }
  initializeScopes(inModule = this.options.sourceType === "module") {
    const oldLabels = this.state.labels;
    this.state.labels = [];
    const oldExportedIdentifiers = this.exportedIdentifiers;
    this.exportedIdentifiers = new Set();
    const oldInModule = this.inModule;
    this.inModule = inModule;
    const oldScope = this.scope;
    const ScopeHandler = this.getScopeHandler();
    this.scope = new ScopeHandler(this, inModule);
    const oldProdParam = this.prodParam;
    this.prodParam = new ProductionParameterHandler();
    const oldClassScope = this.classScope;
    this.classScope = new ClassScopeHandler(this);
    const oldExpressionScope = this.expressionScope;
    this.expressionScope = new ExpressionScopeHandler(this);
    return () => {
      this.state.labels = oldLabels;
      this.exportedIdentifiers = oldExportedIdentifiers;
      this.inModule = oldInModule;
      this.scope = oldScope;
      this.prodParam = oldProdParam;
      this.classScope = oldClassScope;
      this.expressionScope = oldExpressionScope;
    };
  }
  enterInitialScopes() {
    let paramFlags = 0;
    if (this.inModule || this.optionFlags & 1) {
      paramFlags |= 2;
    }
    if (this.optionFlags & 32) {
      paramFlags |= 1;
    }
    const isCommonJS = !this.inModule && this.options.sourceType === "commonjs";
    if (isCommonJS || this.optionFlags & 2) {
      paramFlags |= 4;
    }
    this.prodParam.enter(paramFlags);
    let scopeFlags = isCommonJS ? 514 : 1;
    if (this.optionFlags & 4) {
      scopeFlags |= 512;
    }
    this.scope.enter(scopeFlags);
  }
  checkDestructuringPrivate(refExpressionErrors) {
    const {
      privateKeyLoc
    } = refExpressionErrors;
    if (privateKeyLoc !== null) {
      this.expectPlugin("destructuringPrivate", privateKeyLoc);
    }
  }
}
class ExpressionErrors {
  constructor() {
    this.shorthandAssignLoc = null;
    this.doubleProtoLoc = null;
    this.privateKeyLoc = null;
    this.optionalParametersLoc = null;
    this.voidPatternLoc = null;
  }
}
class Node {
  constructor(parser, pos, loc) {
    this.type = "";
    this.start = pos;
    this.end = 0;
    this.loc = new SourceLocation(loc);
    if ((parser == null ? void 0 : parser.optionFlags) & 128) this.range = [pos, 0];
    if (parser != null && parser.filename) this.loc.filename = parser.filename;
  }
}
const NodePrototype = Node.prototype;
NodePrototype.__clone = function () {
  const newNode = new Node(undefined, this.start, this.loc.start);
  const keys = Object.keys(this);
  for (let i = 0, length = keys.length; i < length; i++) {
    const key = keys[i];
    if (key !== "leadingComments" && key !== "trailingComments" && key !== "innerComments") {
      newNode[key] = this[key];
    }
  }
  return newNode;
};
class NodeUtils extends UtilParser {
  startNode() {
    const loc = this.state.startLoc;
    return new Node(this, loc.index, loc);
  }
  startNodeAt(loc) {
    return new Node(this, loc.index, loc);
  }
  startNodeAtNode(type) {
    return this.startNodeAt(type.loc.start);
  }
  finishNode(node, type) {
    return this.finishNodeAt(node, type, this.state.lastTokEndLoc);
  }
  finishNodeAt(node, type, endLoc) {
    node.type = type;
    node.end = endLoc.index;
    node.loc.end = endLoc;
    if (this.optionFlags & 128) node.range[1] = endLoc.index;
    if (this.optionFlags & 4096) {
      this.processComment(node);
    }
    return node;
  }
  resetStartLocation(node, startLoc) {
    node.start = startLoc.index;
    node.loc.start = startLoc;
    if (this.optionFlags & 128) node.range[0] = startLoc.index;
  }
  resetEndLocation(node, endLoc = this.state.lastTokEndLoc) {
    node.end = endLoc.index;
    node.loc.end = endLoc;
    if (this.optionFlags & 128) node.range[1] = endLoc.index;
  }
  resetStartLocationFromNode(node, locationNode) {
    this.resetStartLocation(node, locationNode.loc.start);
  }
  castNodeTo(node, type) {
    node.type = type;
    return node;
  }
  cloneIdentifier(node) {
    const {
      type,
      start,
      end,
      loc,
      range,
      name
    } = node;
    const cloned = Object.create(NodePrototype);
    cloned.type = type;
    cloned.start = start;
    cloned.end = end;
    cloned.loc = loc;
    cloned.range = range;
    cloned.name = name;
    if (node.extra) cloned.extra = node.extra;
    return cloned;
  }
  cloneStringLiteral(node) {
    const {
      type,
      start,
      end,
      loc,
      range,
      extra
    } = node;
    const cloned = Object.create(NodePrototype);
    cloned.type = type;
    cloned.start = start;
    cloned.end = end;
    cloned.loc = loc;
    cloned.range = range;
    cloned.extra = extra;
    cloned.value = node.value;
    return cloned;
  }
}
const unwrapParenthesizedExpression = node => {
  return node.type === "ParenthesizedExpression" ? unwrapParenthesizedExpression(node.expression) : node;
};
class LValParser extends NodeUtils {
  toAssignable(node, isLHS = false) {
    var _node$extra, _node$extra3;
    let parenthesized = undefined;
    if (node.type === "ParenthesizedExpression" || (_node$extra = node.extra) != null && _node$extra.parenthesized) {
      parenthesized = unwrapParenthesizedExpression(node);
      if (isLHS) {
        if (parenthesized.type === "Identifier") {
          this.expressionScope.recordArrowParameterBindingError(Errors.InvalidParenthesizedAssignment, node);
        } else if (parenthesized.type !== "CallExpression" && parenthesized.type !== "MemberExpression" && !this.isOptionalMemberExpression(parenthesized)) {
          this.raise(Errors.InvalidParenthesizedAssignment, node);
        }
      } else {
        this.raise(Errors.InvalidParenthesizedAssignment, node);
      }
    }
    switch (node.type) {
      case "Identifier":
      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "RestElement":
      case "VoidPattern":
        break;
      case "ObjectExpression":
        this.castNodeTo(node, "ObjectPattern");
        for (let i = 0, length = node.properties.length, last = length - 1; i < length; i++) {
          var _node$extra2;
          const prop = node.properties[i];
          const isLast = i === last;
          this.toAssignableObjectExpressionProp(prop, isLast, isLHS);
          if (isLast && prop.type === "RestElement" && (_node$extra2 = node.extra) != null && _node$extra2.trailingCommaLoc) {
            this.raise(Errors.RestTrailingComma, node.extra.trailingCommaLoc);
          }
        }
        break;
      case "ObjectProperty":
        {
          const {
            key,
            value
          } = node;
          if (this.isPrivateName(key)) {
            this.classScope.usePrivateName(this.getPrivateNameSV(key), key.loc.start);
          }
          this.toAssignable(value, isLHS);
          break;
        }
      case "SpreadElement":
        {
          throw new Error("Internal @babel/parser error (this is a bug, please report it)." + " SpreadElement should be converted by .toAssignable's caller.");
        }
      case "ArrayExpression":
        this.castNodeTo(node, "ArrayPattern");
        this.toAssignableList(node.elements, (_node$extra3 = node.extra) == null ? void 0 : _node$extra3.trailingCommaLoc, isLHS);
        break;
      case "AssignmentExpression":
        if (node.operator !== "=") {
          this.raise(Errors.MissingEqInAssignment, node.left.loc.end);
        }
        this.castNodeTo(node, "AssignmentPattern");
        delete node.operator;
        if (node.left.type === "VoidPattern") {
          this.raise(Errors.VoidPatternInitializer, node.left);
        }
        this.toAssignable(node.left, isLHS);
        break;
      case "ParenthesizedExpression":
        this.toAssignable(parenthesized, isLHS);
        break;
    }
  }
  toAssignableObjectExpressionProp(prop, isLast, isLHS) {
    if (prop.type === "ObjectMethod") {
      this.raise(prop.kind === "get" || prop.kind === "set" ? Errors.PatternHasAccessor : Errors.PatternHasMethod, prop.key);
    } else if (prop.type === "SpreadElement") {
      this.castNodeTo(prop, "RestElement");
      const arg = prop.argument;
      this.checkToRestConversion(arg, false);
      this.toAssignable(arg, isLHS);
      if (!isLast) {
        this.raise(Errors.RestTrailingComma, prop);
      }
    } else {
      this.toAssignable(prop, isLHS);
    }
  }
  toAssignableList(exprList, trailingCommaLoc, isLHS) {
    const end = exprList.length - 1;
    for (let i = 0; i <= end; i++) {
      const elt = exprList[i];
      if (!elt) continue;
      this.toAssignableListItem(exprList, i, isLHS);
      if (elt.type === "RestElement") {
        if (i < end) {
          this.raise(Errors.RestTrailingComma, elt);
        } else if (trailingCommaLoc) {
          this.raise(Errors.RestTrailingComma, trailingCommaLoc);
        }
      }
    }
  }
  toAssignableListItem(exprList, index, isLHS) {
    const node = exprList[index];
    if (node.type === "SpreadElement") {
      this.castNodeTo(node, "RestElement");
      const arg = node.argument;
      this.checkToRestConversion(arg, true);
      this.toAssignable(arg, isLHS);
    } else {
      this.toAssignable(node, isLHS);
    }
  }
  isAssignable(node, isBinding) {
    switch (node.type) {
      case "Identifier":
      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "RestElement":
      case "VoidPattern":
        return true;
      case "ObjectExpression":
        {
          const last = node.properties.length - 1;
          return node.properties.every((prop, i) => {
            return prop.type !== "ObjectMethod" && (i === last || prop.type !== "SpreadElement") && this.isAssignable(prop);
          });
        }
      case "ObjectProperty":
        return this.isAssignable(node.value);
      case "SpreadElement":
        return this.isAssignable(node.argument);
      case "ArrayExpression":
        return node.elements.every(element => element === null || this.isAssignable(element));
      case "AssignmentExpression":
        return node.operator === "=";
      case "ParenthesizedExpression":
        return this.isAssignable(node.expression);
      case "MemberExpression":
      case "OptionalMemberExpression":
        return !isBinding;
      default:
        return false;
    }
  }
  toReferencedList(exprList, isParenthesizedExpr) {
    return exprList;
  }
  toReferencedListDeep(exprList, isParenthesizedExpr) {
    this.toReferencedList(exprList, isParenthesizedExpr);
    for (const expr of exprList) {
      if ((expr == null ? void 0 : expr.type) === "ArrayExpression") {
        this.toReferencedListDeep(expr.elements);
      }
    }
  }
  parseSpread(refExpressionErrors) {
    const node = this.startNode();
    this.next();
    node.argument = this.parseMaybeAssignAllowIn(refExpressionErrors, undefined);
    return this.finishNode(node, "SpreadElement");
  }
  parseRestBinding() {
    const node = this.startNode();
    this.next();
    const argument = this.parseBindingAtom();
    if (argument.type === "VoidPattern") {
      this.raise(Errors.UnexpectedVoidPattern, argument);
    }
    node.argument = argument;
    return this.finishNode(node, "RestElement");
  }
  parseBindingAtom() {
    switch (this.state.type) {
      case 0:
        {
          const node = this.startNode();
          this.next();
          node.elements = this.parseBindingList(3, 93, 1);
          return this.finishNode(node, "ArrayPattern");
        }
      case 5:
        return this.parseObjectLike(8, true);
      case 88:
        return this.parseVoidPattern(null);
    }
    return this.parseIdentifier();
  }
  parseBindingList(close, closeCharCode, flags) {
    const allowEmpty = flags & 1;
    const elts = [];
    let first = true;
    while (!this.eat(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(12);
      }
      if (allowEmpty && this.match(12)) {
        elts.push(null);
      } else if (this.eat(close)) {
        break;
      } else if (this.match(21)) {
        let rest = this.parseRestBinding();
        if (this.hasPlugin("flow") || flags & 2) {
          rest = this.parseFunctionParamType(rest);
        }
        elts.push(rest);
        if (!this.checkCommaAfterRest(closeCharCode)) {
          this.expect(close);
          break;
        }
      } else {
        const decorators = [];
        if (flags & 2) {
          if (this.match(26) && this.hasPlugin("decorators")) {
            this.raise(Errors.UnsupportedParameterDecorator, this.state.startLoc);
          }
          while (this.match(26)) {
            decorators.push(this.parseDecorator());
          }
        }
        elts.push(this.parseBindingElement(flags, decorators));
      }
    }
    return elts;
  }
  parseBindingRestProperty(prop) {
    this.next();
    if (this.hasPlugin("discardBinding") && this.match(88)) {
      prop.argument = this.parseVoidPattern(null);
      this.raise(Errors.UnexpectedVoidPattern, prop.argument);
    } else {
      prop.argument = this.parseIdentifier();
    }
    this.checkCommaAfterRest(125);
    return this.finishNode(prop, "RestElement");
  }
  parseBindingProperty() {
    const {
      type,
      startLoc
    } = this.state;
    if (type === 21) {
      return this.parseBindingRestProperty(this.startNode());
    }
    const prop = this.startNode();
    if (type === 139) {
      this.expectPlugin("destructuringPrivate", startLoc);
      this.classScope.usePrivateName(this.state.value, startLoc);
      prop.key = this.parsePrivateName();
    } else {
      this.parsePropertyName(prop);
    }
    prop.method = false;
    return this.parseObjPropValue(prop, startLoc, false, false, true, false);
  }
  parseBindingElement(flags, decorators) {
    const left = this.parseMaybeDefault();
    if (this.hasPlugin("flow") || flags & 2) {
      this.parseFunctionParamType(left);
    }
    if (decorators.length) {
      left.decorators = decorators;
      this.resetStartLocationFromNode(left, decorators[0]);
    }
    const elt = this.parseMaybeDefault(left.loc.start, left);
    return elt;
  }
  parseFunctionParamType(param) {
    return param;
  }
  parseMaybeDefault(startLoc, left) {
    startLoc != null ? startLoc : startLoc = this.state.startLoc;
    left = left != null ? left : this.parseBindingAtom();
    if (!this.eat(29)) return left;
    const node = this.startNodeAt(startLoc);
    if (left.type === "VoidPattern") {
      this.raise(Errors.VoidPatternInitializer, left);
    }
    node.left = left;
    node.right = this.parseMaybeAssignAllowIn();
    return this.finishNode(node, "AssignmentPattern");
  }
  isValidLVal(type, disallowCallExpression, isUnparenthesizedInAssign, binding) {
    switch (type) {
      case "AssignmentPattern":
        return "left";
      case "RestElement":
        return "argument";
      case "ObjectProperty":
        return "value";
      case "ParenthesizedExpression":
        return "expression";
      case "ArrayPattern":
        return "elements";
      case "ObjectPattern":
        return "properties";
      case "VoidPattern":
        return true;
      case "CallExpression":
        if (!disallowCallExpression && !this.state.strict && this.optionFlags & 8192) {
          return true;
        }
    }
    return false;
  }
  isOptionalMemberExpression(expression) {
    return expression.type === "OptionalMemberExpression";
  }
  checkLVal(expression, ancestor, binding = 64, checkClashes = false, strictModeChanged = false, hasParenthesizedAncestor = false, disallowCallExpression = false) {
    var _expression$extra;
    const type = expression.type;
    if (this.isObjectMethod(expression)) return;
    const isOptionalMemberExpression = this.isOptionalMemberExpression(expression);
    if (isOptionalMemberExpression || type === "MemberExpression") {
      if (isOptionalMemberExpression) {
        this.expectPlugin("optionalChainingAssign", expression.loc.start);
        if (ancestor.type !== "AssignmentExpression") {
          this.raise(Errors.InvalidLhsOptionalChaining, expression, {
            ancestor
          });
        }
      }
      if (binding !== 64) {
        this.raise(Errors.InvalidPropertyBindingPattern, expression);
      }
      return;
    }
    if (type === "Identifier") {
      this.checkIdentifier(expression, binding, strictModeChanged);
      const {
        name
      } = expression;
      if (checkClashes) {
        if (checkClashes.has(name)) {
          this.raise(Errors.ParamDupe, expression);
        } else {
          checkClashes.add(name);
        }
      }
      return;
    } else if (type === "VoidPattern" && ancestor.type === "CatchClause") {
      this.raise(Errors.VoidPatternCatchClauseParam, expression);
    }
    const unwrappedExpression = unwrapParenthesizedExpression(expression);
    disallowCallExpression || (disallowCallExpression = unwrappedExpression.type === "CallExpression" && (unwrappedExpression.callee.type === "Import" || unwrappedExpression.callee.type === "Super"));
    const validity = this.isValidLVal(type, disallowCallExpression, !(hasParenthesizedAncestor || (_expression$extra = expression.extra) != null && _expression$extra.parenthesized) && ancestor.type === "AssignmentExpression", binding);
    if (validity === true) return;
    if (validity === false) {
      const ParseErrorClass = binding === 64 ? Errors.InvalidLhs : Errors.InvalidLhsBinding;
      this.raise(ParseErrorClass, expression, {
        ancestor
      });
      return;
    }
    let key, isParenthesizedExpression;
    if (typeof validity === "string") {
      key = validity;
      isParenthesizedExpression = type === "ParenthesizedExpression";
    } else {
      [key, isParenthesizedExpression] = validity;
    }
    const nextAncestor = type === "ArrayPattern" || type === "ObjectPattern" ? {
      type
    } : ancestor;
    const val = expression[key];
    if (Array.isArray(val)) {
      for (const child of val) {
        if (child) {
          this.checkLVal(child, nextAncestor, binding, checkClashes, strictModeChanged, isParenthesizedExpression, true);
        }
      }
    } else if (val) {
      this.checkLVal(val, nextAncestor, binding, checkClashes, strictModeChanged, isParenthesizedExpression, disallowCallExpression);
    }
  }
  checkIdentifier(at, bindingType, strictModeChanged = false) {
    if (this.state.strict && (strictModeChanged ? isStrictBindReservedWord(at.name, this.inModule) : isStrictBindOnlyReservedWord(at.name))) {
      if (bindingType === 64) {
        this.raise(Errors.StrictEvalArguments, at, {
          referenceName: at.name
        });
      } else {
        this.raise(Errors.StrictEvalArgumentsBinding, at, {
          bindingName: at.name
        });
      }
    }
    if (bindingType & 8192 && at.name === "let") {
      this.raise(Errors.LetInLexicalBinding, at);
    }
    if (!(bindingType & 64)) {
      this.declareNameFromIdentifier(at, bindingType);
    }
  }
  declareNameFromIdentifier(identifier, binding) {
    this.scope.declareName(identifier.name, binding, identifier.loc.start);
  }
  checkToRestConversion(node, allowPattern) {
    switch (node.type) {
      case "ParenthesizedExpression":
        this.checkToRestConversion(node.expression, allowPattern);
        break;
      case "Identifier":
      case "MemberExpression":
        break;
      case "ArrayExpression":
      case "ObjectExpression":
        if (allowPattern) break;
      default:
        this.raise(Errors.InvalidRestAssignmentPattern, node);
    }
  }
  checkCommaAfterRest(close) {
    if (!this.match(12)) {
      return false;
    }
    this.raise(this.lookaheadCharCode() === close ? Errors.RestTrailingComma : Errors.ElementAfterRest, this.state.startLoc);
    return true;
  }
}
const keywordAndTSRelationalOperator = /in(?:stanceof)?|as|satisfies/y;
function nonNull(x) {
  if (x == null) {
    throw new Error(`Unexpected ${x} value.`);
  }
  return x;
}
function assert(x) {
  if (!x) {
    throw new Error("Assert fail");
  }
}
const TSErrors = ParseErrorEnum`typescript`({
  AbstractMethodHasImplementation: ({
    methodName
  }) => `Method '${methodName}' cannot have an implementation because it is marked abstract.`,
  AbstractPropertyHasInitializer: ({
    propertyName
  }) => `Property '${propertyName}' cannot have an initializer because it is marked abstract.`,
  AccessorCannotBeOptional: "An 'accessor' property cannot be declared optional.",
  AccessorCannotDeclareThisParameter: "'get' and 'set' accessors cannot declare 'this' parameters.",
  AccessorCannotHaveTypeParameters: "An accessor cannot have type parameters.",
  ClassMethodHasDeclare: "Class methods cannot have the 'declare' modifier.",
  ClassMethodHasReadonly: "Class methods cannot have the 'readonly' modifier.",
  ConstInitializerMustBeStringOrNumericLiteralOrLiteralEnumReference: "A 'const' initializer in an ambient context must be a string or numeric literal or literal enum reference.",
  ConstructorHasTypeParameters: "Type parameters cannot appear on a constructor declaration.",
  DeclareAccessor: ({
    kind
  }) => `'declare' is not allowed in ${kind}ters.`,
  DeclareClassFieldHasInitializer: "Initializers are not allowed in ambient contexts.",
  DeclareFunctionHasImplementation: "An implementation cannot be declared in ambient contexts.",
  DuplicateAccessibilityModifier: ({
    modifier
  }) => `Accessibility modifier already seen: '${modifier}'.`,
  DuplicateModifier: ({
    modifier
  }) => `Duplicate modifier: '${modifier}'.`,
  EmptyHeritageClauseType: ({
    token
  }) => `'${token}' list cannot be empty.`,
  EmptyTypeArguments: "Type argument list cannot be empty.",
  EmptyTypeParameters: "Type parameter list cannot be empty.",
  ExpectedAmbientAfterExportDeclare: "'export declare' must be followed by an ambient declaration.",
  ImportAliasHasImportType: "An import alias can not use 'import type'.",
  ImportReflectionHasImportType: "An `import module` declaration can not use `type` modifier",
  IncompatibleModifiers: ({
    modifiers
  }) => `'${modifiers[0]}' modifier cannot be used with '${modifiers[1]}' modifier.`,
  IndexSignatureHasAbstract: "Index signatures cannot have the 'abstract' modifier.",
  IndexSignatureHasAccessibility: ({
    modifier
  }) => `Index signatures cannot have an accessibility modifier ('${modifier}').`,
  IndexSignatureHasDeclare: "Index signatures cannot have the 'declare' modifier.",
  IndexSignatureHasOverride: "'override' modifier cannot appear on an index signature.",
  IndexSignatureHasStatic: "Index signatures cannot have the 'static' modifier.",
  InitializerNotAllowedInAmbientContext: "Initializers are not allowed in ambient contexts.",
  InvalidHeritageClauseType: ({
    token
  }) => `'${token}' list can only include identifiers or qualified-names with optional type arguments.`,
  InvalidModifierOnAwaitUsingDeclaration: modifier => `'${modifier}' modifier cannot appear on an await using declaration.`,
  InvalidModifierOnTypeMember: ({
    modifier
  }) => `'${modifier}' modifier cannot appear on a type member.`,
  InvalidModifierOnTypeParameter: ({
    modifier
  }) => `'${modifier}' modifier cannot appear on a type parameter.`,
  InvalidModifierOnTypeParameterPositions: ({
    modifier
  }) => `'${modifier}' modifier can only appear on a type parameter of a class, interface or type alias.`,
  InvalidModifierOnUsingDeclaration: modifier => `'${modifier}' modifier cannot appear on a using declaration.`,
  InvalidModifiersOrder: ({
    orderedModifiers
  }) => `'${orderedModifiers[0]}' modifier must precede '${orderedModifiers[1]}' modifier.`,
  InvalidPropertyAccessAfterInstantiationExpression: "Invalid property access after an instantiation expression. " + "You can either wrap the instantiation expression in parentheses, or delete the type arguments.",
  InvalidTupleMemberLabel: "Tuple members must be labeled with a simple identifier.",
  MissingInterfaceName: "'interface' declarations must be followed by an identifier.",
  NonAbstractClassHasAbstractMethod: "Abstract methods can only appear within an abstract class.",
  NonClassMethodPropertyHasAbstractModifier: "'abstract' modifier can only appear on a class, method, or property declaration.",
  OptionalTypeBeforeRequired: "A required element cannot follow an optional element.",
  OverrideNotInSubClass: "This member cannot have an 'override' modifier because its containing class does not extend another class.",
  PatternIsOptional: "A binding pattern parameter cannot be optional in an implementation signature.",
  PrivateElementHasAbstract: "Private elements cannot have the 'abstract' modifier.",
  PrivateElementHasAccessibility: ({
    modifier
  }) => `Private elements cannot have an accessibility modifier ('${modifier}').`,
  ReadonlyForMethodSignature: "'readonly' modifier can only appear on a property declaration or index signature.",
  ReservedArrowTypeParam: "This syntax is reserved in files with the .mts or .cts extension. Add a trailing comma, as in `<T,>() => ...`.",
  ReservedTypeAssertion: "This syntax is reserved in files with the .mts or .cts extension. Use an `as` expression instead.",
  SetAccessorCannotHaveOptionalParameter: "A 'set' accessor cannot have an optional parameter.",
  SetAccessorCannotHaveRestParameter: "A 'set' accessor cannot have rest parameter.",
  SetAccessorCannotHaveReturnType: "A 'set' accessor cannot have a return type annotation.",
  SingleTypeParameterWithoutTrailingComma: ({
    typeParameterName
  }) => `Single type parameter ${typeParameterName} should have a trailing comma. Example usage: <${typeParameterName},>.`,
  StaticBlockCannotHaveModifier: "Static class blocks cannot have any modifier.",
  TupleOptionalAfterType: "A labeled tuple optional element must be declared using a question mark after the name and before the colon (`name?: type`), rather than after the type (`name: type?`).",
  TypeAnnotationAfterAssign: "Type annotations must come before default assignments, e.g. instead of `age = 25: number` use `age: number = 25`.",
  TypeImportCannotSpecifyDefaultAndNamed: "A type-only import can specify a default import or named bindings, but not both.",
  TypeModifierIsUsedInTypeExports: "The 'type' modifier cannot be used on a named export when 'export type' is used on its export statement.",
  TypeModifierIsUsedInTypeImports: "The 'type' modifier cannot be used on a named import when 'import type' is used on its import statement.",
  UnexpectedParameterModifier: "A parameter property is only allowed in a constructor implementation.",
  UnexpectedReadonly: "'readonly' type modifier is only permitted on array and tuple literal types.",
  UnexpectedTypeAnnotation: "Did not expect a type annotation here.",
  UnexpectedTypeCastInParameter: "Unexpected type cast in parameter position.",
  UnsupportedImportTypeArgument: "Argument in a type import must be a string literal.",
  UnsupportedParameterPropertyKind: "A parameter property may not be declared using a binding pattern.",
  UnsupportedSignatureParameterKind: ({
    type
  }) => `Name in a signature must be an Identifier, ObjectPattern or ArrayPattern, instead got ${type}.`,
  UsingDeclarationInAmbientContext: kind => `'${kind}' declarations are not allowed in ambient contexts.`
});
function keywordTypeFromName(value) {
  switch (value) {
    case "any":
      return "TSAnyKeyword";
    case "boolean":
      return "TSBooleanKeyword";
    case "bigint":
      return "TSBigIntKeyword";
    case "never":
      return "TSNeverKeyword";
    case "number":
      return "TSNumberKeyword";
    case "object":
      return "TSObjectKeyword";
    case "string":
      return "TSStringKeyword";
    case "symbol":
      return "TSSymbolKeyword";
    case "undefined":
      return "TSUndefinedKeyword";
    case "unknown":
      return "TSUnknownKeyword";
    default:
      return undefined;
  }
}
function tsIsAccessModifier(modifier) {
  return modifier === "private" || modifier === "public" || modifier === "protected";
}
function tsIsVarianceAnnotations(modifier) {
  return modifier === "in" || modifier === "out";
}
var typescript = superClass => class TypeScriptParserMixin extends superClass {
  constructor(...args) {
    super(...args);
    this.tsParseInOutModifiers = this.tsParseModifiers.bind(this, {
      allowedModifiers: ["in", "out"],
      disallowedModifiers: ["const", "public", "private", "protected", "readonly", "declare", "abstract", "override"],
      errorTemplate: TSErrors.InvalidModifierOnTypeParameter
    });
    this.tsParseConstModifier = this.tsParseModifiers.bind(this, {
      allowedModifiers: ["const"],
      disallowedModifiers: ["in", "out"],
      errorTemplate: TSErrors.InvalidModifierOnTypeParameterPositions
    });
    this.tsParseInOutConstModifiers = this.tsParseModifiers.bind(this, {
      allowedModifiers: ["in", "out", "const"],
      disallowedModifiers: ["public", "private", "protected", "readonly", "declare", "abstract", "override"],
      errorTemplate: TSErrors.InvalidModifierOnTypeParameter
    });
  }
  getScopeHandler() {
    return TypeScriptScopeHandler;
  }
  tsIsIdentifier() {
    return tokenIsIdentifier(this.state.type);
  }
  tsTokenCanFollowModifier() {
    return this.match(0) || this.match(5) || this.match(55) || this.match(21) || this.match(139) || this.isLiteralPropertyName();
  }
  tsNextTokenOnSameLineAndCanFollowModifier() {
    this.next();
    if (this.hasPrecedingLineBreak()) {
      return false;
    }
    return this.tsTokenCanFollowModifier();
  }
  tsNextTokenCanFollowModifier() {
    if (this.match(106)) {
      this.next();
      return this.tsTokenCanFollowModifier();
    }
    return this.tsNextTokenOnSameLineAndCanFollowModifier();
  }
  tsParseModifier(allowedModifiers, stopOnStartOfClassStaticBlock, hasSeenStaticModifier) {
    if (!tokenIsIdentifier(this.state.type) && this.state.type !== 58 && this.state.type !== 75) {
      return undefined;
    }
    const modifier = this.state.value;
    if (allowedModifiers.includes(modifier)) {
      if (hasSeenStaticModifier && this.match(106)) {
        return undefined;
      }
      if (stopOnStartOfClassStaticBlock && this.tsIsStartOfStaticBlocks()) {
        return undefined;
      }
      if (this.tsTryParse(this.tsNextTokenCanFollowModifier.bind(this))) {
        return modifier;
      }
    }
    return undefined;
  }
  tsParseModifiers({
    allowedModifiers,
    disallowedModifiers,
    stopOnStartOfClassStaticBlock,
    errorTemplate = TSErrors.InvalidModifierOnTypeMember
  }, modified) {
    const enforceOrder = (loc, modifier, before, after) => {
      if (modifier === before && modified[after]) {
        this.raise(TSErrors.InvalidModifiersOrder, loc, {
          orderedModifiers: [before, after]
        });
      }
    };
    const incompatible = (loc, modifier, mod1, mod2) => {
      if (modified[mod1] && modifier === mod2 || modified[mod2] && modifier === mod1) {
        this.raise(TSErrors.IncompatibleModifiers, loc, {
          modifiers: [mod1, mod2]
        });
      }
    };
    for (;;) {
      const {
        startLoc
      } = this.state;
      const modifier = this.tsParseModifier(allowedModifiers.concat(disallowedModifiers != null ? disallowedModifiers : []), stopOnStartOfClassStaticBlock, modified.static);
      if (!modifier) break;
      if (tsIsAccessModifier(modifier)) {
        if (modified.accessibility) {
          this.raise(TSErrors.DuplicateAccessibilityModifier, startLoc, {
            modifier
          });
        } else {
          enforceOrder(startLoc, modifier, modifier, "override");
          enforceOrder(startLoc, modifier, modifier, "static");
          enforceOrder(startLoc, modifier, modifier, "readonly");
          modified.accessibility = modifier;
        }
      } else if (tsIsVarianceAnnotations(modifier)) {
        if (modified[modifier]) {
          this.raise(TSErrors.DuplicateModifier, startLoc, {
            modifier
          });
        }
        modified[modifier] = true;
        enforceOrder(startLoc, modifier, "in", "out");
      } else {
        if (hasOwnProperty.call(modified, modifier)) {
          this.raise(TSErrors.DuplicateModifier, startLoc, {
            modifier
          });
        } else {
          enforceOrder(startLoc, modifier, "static", "readonly");
          enforceOrder(startLoc, modifier, "static", "override");
          enforceOrder(startLoc, modifier, "override", "readonly");
          enforceOrder(startLoc, modifier, "abstract", "override");
          incompatible(startLoc, modifier, "declare", "override");
          incompatible(startLoc, modifier, "static", "abstract");
        }
        modified[modifier] = true;
      }
      if (disallowedModifiers != null && disallowedModifiers.includes(modifier)) {
        this.raise(errorTemplate, startLoc, {
          modifier
        });
      }
    }
  }
  tsIsListTerminator(kind) {
    switch (kind) {
      case "EnumMembers":
      case "TypeMembers":
        return this.match(8);
      case "HeritageClauseElement":
        return this.match(5);
      case "TupleElementTypes":
        return this.match(3);
      case "TypeParametersOrArguments":
        return this.match(48);
    }
  }
  tsParseList(kind, parseElement) {
    const result = [];
    while (!this.tsIsListTerminator(kind)) {
      result.push(parseElement());
    }
    return result;
  }
  tsParseDelimitedList(kind, parseElement, refTrailingCommaPos) {
    return nonNull(this.tsParseDelimitedListWorker(kind, parseElement, true, refTrailingCommaPos));
  }
  tsParseDelimitedListWorker(kind, parseElement, expectSuccess, refTrailingCommaPos) {
    const result = [];
    let trailingCommaPos = -1;
    for (;;) {
      if (this.tsIsListTerminator(kind)) {
        break;
      }
      trailingCommaPos = -1;
      const element = parseElement();
      if (element == null) {
        return undefined;
      }
      result.push(element);
      if (this.eat(12)) {
        trailingCommaPos = this.state.lastTokStartLoc.index;
        continue;
      }
      if (this.tsIsListTerminator(kind)) {
        break;
      }
      if (expectSuccess) {
        this.expect(12);
      }
      return undefined;
    }
    if (refTrailingCommaPos) {
      refTrailingCommaPos.value = trailingCommaPos;
    }
    return result;
  }
  tsParseBracketedList(kind, parseElement, bracket, skipFirstToken, refTrailingCommaPos) {
    if (!skipFirstToken) {
      if (bracket) {
        this.expect(0);
      } else {
        this.expect(47);
      }
    }
    const result = this.tsParseDelimitedList(kind, parseElement, refTrailingCommaPos);
    if (bracket) {
      this.expect(3);
    } else {
      this.expect(48);
    }
    return result;
  }
  tsParseImportType() {
    const node = this.startNode();
    this.expect(83);
    this.expect(10);
    if (!this.match(134)) {
      this.raise(TSErrors.UnsupportedImportTypeArgument, this.state.startLoc);
      node.argument = super.parseExprAtom();
    } else {
      node.argument = this.parseStringLiteral(this.state.value);
    }
    if (this.eat(12)) {
      node.options = this.tsParseImportTypeOptions();
    } else {
      node.options = null;
    }
    this.expect(11);
    if (this.eat(16)) {
      node.qualifier = this.tsParseEntityName(1 | 2);
    }
    if (this.match(47)) {
      node.typeParameters = this.tsParseTypeArguments();
    }
    return this.finishNode(node, "TSImportType");
  }
  tsParseImportTypeOptions() {
    const node = this.startNode();
    this.expect(5);
    const withProperty = this.startNode();
    if (this.isContextual(76)) {
      withProperty.method = false;
      withProperty.key = this.parseIdentifier(true);
      withProperty.computed = false;
      withProperty.shorthand = false;
    } else {
      this.unexpected(null, 76);
    }
    this.expect(14);
    withProperty.value = this.tsParseImportTypeWithPropertyValue();
    node.properties = [this.finishObjectProperty(withProperty)];
    this.eat(12);
    this.expect(8);
    return this.finishNode(node, "ObjectExpression");
  }
  tsParseImportTypeWithPropertyValue() {
    const node = this.startNode();
    const properties = [];
    this.expect(5);
    while (!this.match(8)) {
      const type = this.state.type;
      if (tokenIsIdentifier(type) || type === 134) {
        properties.push(super.parsePropertyDefinition(null));
      } else {
        this.unexpected();
      }
      this.eat(12);
    }
    node.properties = properties;
    this.next();
    return this.finishNode(node, "ObjectExpression");
  }
  tsParseEntityName(flags) {
    let entity;
    if (flags & 1 && this.match(78)) {
      if (flags & 2) {
        entity = this.parseIdentifier(true);
      } else {
        const node = this.startNode();
        this.next();
        entity = this.finishNode(node, "ThisExpression");
      }
    } else {
      entity = this.parseIdentifier(!!(flags & 1));
    }
    while (this.eat(16)) {
      const node = this.startNodeAtNode(entity);
      node.left = entity;
      node.right = this.parseIdentifier(!!(flags & 1));
      entity = this.finishNode(node, "TSQualifiedName");
    }
    return entity;
  }
  tsParseTypeReference() {
    const node = this.startNode();
    node.typeName = this.tsParseEntityName(1);
    if (!this.hasPrecedingLineBreak() && this.match(47)) {
      node.typeParameters = this.tsParseTypeArguments();
    }
    return this.finishNode(node, "TSTypeReference");
  }
  tsParseThisTypePredicate(lhs) {
    this.next();
    const node = this.startNodeAtNode(lhs);
    node.parameterName = lhs;
    node.typeAnnotation = this.tsParseTypeAnnotation(false);
    node.asserts = false;
    return this.finishNode(node, "TSTypePredicate");
  }
  tsParseThisTypeNode() {
    const node = this.startNode();
    this.next();
    return this.finishNode(node, "TSThisType");
  }
  tsParseTypeQuery() {
    const node = this.startNode();
    this.expect(87);
    if (this.match(83)) {
      node.exprName = this.tsParseImportType();
    } else {
      node.exprName = this.tsParseEntityName(1 | 2);
    }
    if (!this.hasPrecedingLineBreak() && this.match(47)) {
      node.typeParameters = this.tsParseTypeArguments();
    }
    return this.finishNode(node, "TSTypeQuery");
  }
  tsParseTypeParameter(parseModifiers) {
    const node = this.startNode();
    parseModifiers(node);
    node.name = this.tsParseTypeParameterName();
    node.constraint = this.tsEatThenParseType(81);
    node.default = this.tsEatThenParseType(29);
    return this.finishNode(node, "TSTypeParameter");
  }
  tsTryParseTypeParameters(parseModifiers) {
    if (this.match(47)) {
      return this.tsParseTypeParameters(parseModifiers);
    }
  }
  tsParseTypeParameters(parseModifiers) {
    const node = this.startNode();
    if (this.match(47) || this.match(143)) {
      this.next();
    } else {
      this.unexpected();
    }
    const refTrailingCommaPos = {
      value: -1
    };
    node.params = this.tsParseBracketedList("TypeParametersOrArguments", this.tsParseTypeParameter.bind(this, parseModifiers), false, true, refTrailingCommaPos);
    if (node.params.length === 0) {
      this.raise(TSErrors.EmptyTypeParameters, node);
    }
    if (refTrailingCommaPos.value !== -1) {
      this.addExtra(node, "trailingComma", refTrailingCommaPos.value);
    }
    return this.finishNode(node, "TSTypeParameterDeclaration");
  }
  tsFillSignature(returnToken, signature) {
    const returnTokenRequired = returnToken === 19;
    const paramsKey = "parameters";
    const returnTypeKey = "typeAnnotation";
    signature.typeParameters = this.tsTryParseTypeParameters(this.tsParseConstModifier);
    this.expect(10);
    signature[paramsKey] = this.tsParseBindingListForSignature();
    if (returnTokenRequired) {
      signature[returnTypeKey] = this.tsParseTypeOrTypePredicateAnnotation(returnToken);
    } else if (this.match(returnToken)) {
      signature[returnTypeKey] = this.tsParseTypeOrTypePredicateAnnotation(returnToken);
    }
  }
  tsParseBindingListForSignature() {
    const list = super.parseBindingList(11, 41, 2);
    for (const pattern of list) {
      const {
        type
      } = pattern;
      if (type === "AssignmentPattern" || type === "TSParameterProperty") {
        this.raise(TSErrors.UnsupportedSignatureParameterKind, pattern, {
          type
        });
      }
    }
    return list;
  }
  tsParseTypeMemberSemicolon() {
    if (!this.eat(12) && !this.isLineTerminator()) {
      this.expect(13);
    }
  }
  tsParseSignatureMember(kind, node) {
    this.tsFillSignature(14, node);
    this.tsParseTypeMemberSemicolon();
    return this.finishNode(node, kind);
  }
  tsIsUnambiguouslyIndexSignature() {
    this.next();
    if (tokenIsIdentifier(this.state.type)) {
      this.next();
      return this.match(14);
    }
    return false;
  }
  tsTryParseIndexSignature(node) {
    if (!(this.match(0) && this.tsLookAhead(this.tsIsUnambiguouslyIndexSignature.bind(this)))) {
      return;
    }
    this.expect(0);
    const id = this.parseIdentifier();
    id.typeAnnotation = this.tsParseTypeAnnotation();
    this.resetEndLocation(id);
    this.expect(3);
    node.parameters = [id];
    const type = this.tsTryParseTypeAnnotation();
    if (type) node.typeAnnotation = type;
    this.tsParseTypeMemberSemicolon();
    return this.finishNode(node, "TSIndexSignature");
  }
  tsParsePropertyOrMethodSignature(node, readonly) {
    if (this.eat(17)) node.optional = true;
    if (this.match(10) || this.match(47)) {
      if (readonly) {
        this.raise(TSErrors.ReadonlyForMethodSignature, node);
      }
      const method = node;
      if (method.kind && this.match(47)) {
        this.raise(TSErrors.AccessorCannotHaveTypeParameters, this.state.curPosition());
      }
      this.tsFillSignature(14, method);
      this.tsParseTypeMemberSemicolon();
      const paramsKey = "parameters";
      const returnTypeKey = "typeAnnotation";
      if (method.kind === "get") {
        if (method[paramsKey].length > 0) {
          this.raise(Errors.BadGetterArity, this.state.curPosition());
          if (this.isThisParam(method[paramsKey][0])) {
            this.raise(TSErrors.AccessorCannotDeclareThisParameter, this.state.curPosition());
          }
        }
      } else if (method.kind === "set") {
        if (method[paramsKey].length !== 1) {
          this.raise(Errors.BadSetterArity, this.state.curPosition());
        } else {
          const firstParameter = method[paramsKey][0];
          if (this.isThisParam(firstParameter)) {
            this.raise(TSErrors.AccessorCannotDeclareThisParameter, this.state.curPosition());
          }
          if (firstParameter.type === "Identifier" && firstParameter.optional) {
            this.raise(TSErrors.SetAccessorCannotHaveOptionalParameter, this.state.curPosition());
          }
          if (firstParameter.type === "RestElement") {
            this.raise(TSErrors.SetAccessorCannotHaveRestParameter, this.state.curPosition());
          }
        }
        if (method[returnTypeKey]) {
          this.raise(TSErrors.SetAccessorCannotHaveReturnType, method[returnTypeKey]);
        }
      } else {
        method.kind = "method";
      }
      return this.finishNode(method, "TSMethodSignature");
    } else {
      const property = node;
      if (readonly) property.readonly = true;
      const type = this.tsTryParseTypeAnnotation();
      if (type) property.typeAnnotation = type;
      this.tsParseTypeMemberSemicolon();
      return this.finishNode(property, "TSPropertySignature");
    }
  }
  tsParseTypeMember() {
    const node = this.startNode();
    if (this.match(10) || this.match(47)) {
      return this.tsParseSignatureMember("TSCallSignatureDeclaration", node);
    }
    if (this.match(77)) {
      const id = this.startNode();
      this.next();
      if (this.match(10) || this.match(47)) {
        return this.tsParseSignatureMember("TSConstructSignatureDeclaration", node);
      } else {
        node.key = this.createIdentifier(id, "new");
        return this.tsParsePropertyOrMethodSignature(node, false);
      }
    }
    this.tsParseModifiers({
      allowedModifiers: ["readonly"],
      disallowedModifiers: ["declare", "abstract", "private", "protected", "public", "static", "override"]
    }, node);
    const idx = this.tsTryParseIndexSignature(node);
    if (idx) {
      return idx;
    }
    super.parsePropertyName(node);
    if (!node.computed && node.key.type === "Identifier" && (node.key.name === "get" || node.key.name === "set") && this.tsTokenCanFollowModifier()) {
      node.kind = node.key.name;
      super.parsePropertyName(node);
      if (!this.match(10) && !this.match(47)) {
        this.unexpected(null, 10);
      }
    }
    return this.tsParsePropertyOrMethodSignature(node, !!node.readonly);
  }
  tsParseTypeLiteral() {
    const node = this.startNode();
    node.members = this.tsParseObjectTypeMembers();
    return this.finishNode(node, "TSTypeLiteral");
  }
  tsParseObjectTypeMembers() {
    this.expect(5);
    const members = this.tsParseList("TypeMembers", this.tsParseTypeMember.bind(this));
    this.expect(8);
    return members;
  }
  tsIsStartOfMappedType() {
    this.next();
    if (this.eat(53)) {
      return this.isContextual(122);
    }
    if (this.isContextual(122)) {
      this.next();
    }
    if (!this.match(0)) {
      return false;
    }
    this.next();
    if (!this.tsIsIdentifier()) {
      return false;
    }
    this.next();
    return this.match(58);
  }
  tsParseMappedType() {
    const node = this.startNode();
    this.expect(5);
    if (this.match(53)) {
      node.readonly = this.state.value;
      this.next();
      this.expectContextual(122);
    } else if (this.eatContextual(122)) {
      node.readonly = true;
    }
    this.expect(0);
    const typeParameter = this.startNode();
    typeParameter.name = this.tsParseTypeParameterName();
    typeParameter.constraint = this.tsExpectThenParseType(58);
    node.typeParameter = this.finishNode(typeParameter, "TSTypeParameter");
    node.nameType = this.eatContextual(93) ? this.tsParseType() : null;
    this.expect(3);
    if (this.match(53)) {
      node.optional = this.state.value;
      this.next();
      this.expect(17);
    } else if (this.eat(17)) {
      node.optional = true;
    }
    node.typeAnnotation = this.tsTryParseType();
    this.semicolon();
    this.expect(8);
    return this.finishNode(node, "TSMappedType");
  }
  tsParseTupleType() {
    const node = this.startNode();
    node.elementTypes = this.tsParseBracketedList("TupleElementTypes", this.tsParseTupleElementType.bind(this), true, false);
    let seenOptionalElement = false;
    node.elementTypes.forEach(elementNode => {
      const {
        type
      } = elementNode;
      if (seenOptionalElement && type !== "TSRestType" && type !== "TSOptionalType" && !(type === "TSNamedTupleMember" && elementNode.optional)) {
        this.raise(TSErrors.OptionalTypeBeforeRequired, elementNode);
      }
      seenOptionalElement || (seenOptionalElement = type === "TSNamedTupleMember" && elementNode.optional || type === "TSOptionalType");
    });
    return this.finishNode(node, "TSTupleType");
  }
  tsParseTupleElementType() {
    const restStartLoc = this.state.startLoc;
    const rest = this.eat(21);
    const {
      startLoc
    } = this.state;
    let labeled;
    let label;
    let optional;
    let type;
    const isWord = tokenIsKeywordOrIdentifier(this.state.type);
    const chAfterWord = isWord ? this.lookaheadCharCode() : null;
    if (chAfterWord === 58) {
      labeled = true;
      optional = false;
      label = this.parseIdentifier(true);
      this.expect(14);
      type = this.tsParseType();
    } else if (chAfterWord === 63) {
      optional = true;
      const wordName = this.state.value;
      const typeOrLabel = this.tsParseNonArrayType();
      if (this.lookaheadCharCode() === 58) {
        labeled = true;
        label = this.createIdentifier(this.startNodeAt(startLoc), wordName);
        this.expect(17);
        this.expect(14);
        type = this.tsParseType();
      } else {
        labeled = false;
        type = typeOrLabel;
        this.expect(17);
      }
    } else {
      type = this.tsParseType();
      optional = this.eat(17);
      labeled = this.eat(14);
    }
    if (labeled) {
      let labeledNode;
      if (label) {
        labeledNode = this.startNodeAt(startLoc);
        labeledNode.optional = optional;
        labeledNode.label = label;
        labeledNode.elementType = type;
        if (this.eat(17)) {
          labeledNode.optional = true;
          this.raise(TSErrors.TupleOptionalAfterType, this.state.lastTokStartLoc);
        }
      } else {
        labeledNode = this.startNodeAt(startLoc);
        labeledNode.optional = optional;
        this.raise(TSErrors.InvalidTupleMemberLabel, type);
        labeledNode.label = type;
        labeledNode.elementType = this.tsParseType();
      }
      type = this.finishNode(labeledNode, "TSNamedTupleMember");
    } else if (optional) {
      const optionalTypeNode = this.startNodeAt(startLoc);
      optionalTypeNode.typeAnnotation = type;
      type = this.finishNode(optionalTypeNode, "TSOptionalType");
    }
    if (rest) {
      const restNode = this.startNodeAt(restStartLoc);
      restNode.typeAnnotation = type;
      type = this.finishNode(restNode, "TSRestType");
    }
    return type;
  }
  tsParseParenthesizedType() {
    const node = this.startNode();
    this.expect(10);
    node.typeAnnotation = this.tsParseType();
    this.expect(11);
    return this.finishNode(node, "TSParenthesizedType");
  }
  tsParseFunctionOrConstructorType(type, abstract) {
    const node = this.startNode();
    if (type === "TSConstructorType") {
      node.abstract = !!abstract;
      if (abstract) this.next();
      this.next();
    }
    this.tsInAllowConditionalTypesContext(() => this.tsFillSignature(19, node));
    return this.finishNode(node, type);
  }
  tsParseLiteralTypeNode() {
    const node = this.startNode();
    switch (this.state.type) {
      case 135:
      case 136:
      case 134:
      case 85:
      case 86:
        node.literal = super.parseExprAtom();
        break;
      default:
        this.unexpected();
    }
    return this.finishNode(node, "TSLiteralType");
  }
  tsParseTemplateLiteralType() {
    const node = this.startNode();
    node.literal = super.parseTemplate(false);
    return this.finishNode(node, "TSLiteralType");
  }
  parseTemplateSubstitution() {
    if (this.state.inType) return this.tsParseType();
    return super.parseTemplateSubstitution();
  }
  tsParseThisTypeOrThisTypePredicate() {
    const thisKeyword = this.tsParseThisTypeNode();
    if (this.isContextual(116) && !this.hasPrecedingLineBreak()) {
      return this.tsParseThisTypePredicate(thisKeyword);
    } else {
      return thisKeyword;
    }
  }
  tsParseNonArrayType() {
    switch (this.state.type) {
      case 134:
      case 135:
      case 136:
      case 85:
      case 86:
        return this.tsParseLiteralTypeNode();
      case 53:
        if (this.state.value === "-") {
          const node = this.startNode();
          const nextToken = this.lookahead();
          if (nextToken.type !== 135 && nextToken.type !== 136) {
            this.unexpected();
          }
          node.literal = this.parseMaybeUnary();
          return this.finishNode(node, "TSLiteralType");
        }
        break;
      case 78:
        return this.tsParseThisTypeOrThisTypePredicate();
      case 87:
        return this.tsParseTypeQuery();
      case 83:
        return this.tsParseImportType();
      case 5:
        return this.tsLookAhead(this.tsIsStartOfMappedType.bind(this)) ? this.tsParseMappedType() : this.tsParseTypeLiteral();
      case 0:
        return this.tsParseTupleType();
      case 10:
        return this.tsParseParenthesizedType();
      case 25:
      case 24:
        return this.tsParseTemplateLiteralType();
      default:
        {
          const {
            type
          } = this.state;
          if (tokenIsIdentifier(type) || type === 88 || type === 84) {
            const nodeType = type === 88 ? "TSVoidKeyword" : type === 84 ? "TSNullKeyword" : keywordTypeFromName(this.state.value);
            if (nodeType !== undefined && this.lookaheadCharCode() !== 46) {
              const node = this.startNode();
              this.next();
              return this.finishNode(node, nodeType);
            }
            return this.tsParseTypeReference();
          }
        }
    }
    throw this.unexpected();
  }
  tsParseArrayTypeOrHigher() {
    const {
      startLoc
    } = this.state;
    let type = this.tsParseNonArrayType();
    while (!this.hasPrecedingLineBreak() && this.eat(0)) {
      if (this.match(3)) {
        const node = this.startNodeAt(startLoc);
        node.elementType = type;
        this.expect(3);
        type = this.finishNode(node, "TSArrayType");
      } else {
        const node = this.startNodeAt(startLoc);
        node.objectType = type;
        node.indexType = this.tsParseType();
        this.expect(3);
        type = this.finishNode(node, "TSIndexedAccessType");
      }
    }
    return type;
  }
  tsParseTypeOperator() {
    const node = this.startNode();
    const operator = this.state.value;
    this.next();
    node.operator = operator;
    node.typeAnnotation = this.tsParseTypeOperatorOrHigher();
    if (operator === "readonly") {
      this.tsCheckTypeAnnotationForReadOnly(node);
    }
    return this.finishNode(node, "TSTypeOperator");
  }
  tsCheckTypeAnnotationForReadOnly(node) {
    switch (node.typeAnnotation.type) {
      case "TSTupleType":
      case "TSArrayType":
        return;
      default:
        this.raise(TSErrors.UnexpectedReadonly, node);
    }
  }
  tsParseInferType() {
    const node = this.startNode();
    this.expectContextual(115);
    const typeParameter = this.startNode();
    typeParameter.name = this.tsParseTypeParameterName();
    typeParameter.constraint = this.tsTryParse(() => this.tsParseConstraintForInferType());
    node.typeParameter = this.finishNode(typeParameter, "TSTypeParameter");
    return this.finishNode(node, "TSInferType");
  }
  tsParseConstraintForInferType() {
    if (this.eat(81)) {
      const constraint = this.tsInDisallowConditionalTypesContext(() => this.tsParseType());
      if (this.state.inDisallowConditionalTypesContext || !this.match(17)) {
        return constraint;
      }
    }
  }
  tsParseTypeOperatorOrHigher() {
    const isTypeOperator = tokenIsTSTypeOperator(this.state.type) && !this.state.containsEsc;
    return isTypeOperator ? this.tsParseTypeOperator() : this.isContextual(115) ? this.tsParseInferType() : this.tsInAllowConditionalTypesContext(() => this.tsParseArrayTypeOrHigher());
  }
  tsParseUnionOrIntersectionType(kind, parseConstituentType, operator) {
    const node = this.startNode();
    const hasLeadingOperator = this.eat(operator);
    const types = [];
    do {
      types.push(parseConstituentType());
    } while (this.eat(operator));
    if (types.length === 1 && !hasLeadingOperator) {
      return types[0];
    }
    node.types = types;
    return this.finishNode(node, kind);
  }
  tsParseIntersectionTypeOrHigher() {
    return this.tsParseUnionOrIntersectionType("TSIntersectionType", this.tsParseTypeOperatorOrHigher.bind(this), 45);
  }
  tsParseUnionTypeOrHigher() {
    return this.tsParseUnionOrIntersectionType("TSUnionType", this.tsParseIntersectionTypeOrHigher.bind(this), 43);
  }
  tsIsStartOfFunctionType() {
    if (this.match(47)) {
      return true;
    }
    return this.match(10) && this.tsLookAhead(this.tsIsUnambiguouslyStartOfFunctionType.bind(this));
  }
  tsSkipParameterStart() {
    if (tokenIsIdentifier(this.state.type) || this.match(78)) {
      this.next();
      return true;
    }
    if (this.match(5)) {
      const {
        errors
      } = this.state;
      const previousErrorCount = errors.length;
      try {
        this.parseObjectLike(8, true);
        return errors.length === previousErrorCount;
      } catch (_unused) {
        return false;
      }
    }
    if (this.match(0)) {
      this.next();
      const {
        errors
      } = this.state;
      const previousErrorCount = errors.length;
      try {
        super.parseBindingList(3, 93, 1);
        return errors.length === previousErrorCount;
      } catch (_unused2) {
        return false;
      }
    }
    return false;
  }
  tsIsUnambiguouslyStartOfFunctionType() {
    this.next();
    if (this.match(11) || this.match(21)) {
      return true;
    }
    if (this.tsSkipParameterStart()) {
      if (this.match(14) || this.match(12) || this.match(17) || this.match(29)) {
        return true;
      }
      if (this.match(11)) {
        this.next();
        if (this.match(19)) {
          return true;
        }
      }
    }
    return false;
  }
  tsParseTypeOrTypePredicateAnnotation(returnToken) {
    return this.tsInType(() => {
      const t = this.startNode();
      this.expect(returnToken);
      const node = this.startNode();
      const asserts = !!this.tsTryParse(this.tsParseTypePredicateAsserts.bind(this));
      if (asserts && this.match(78)) {
        let thisTypePredicate = this.tsParseThisTypeOrThisTypePredicate();
        if (thisTypePredicate.type === "TSThisType") {
          node.parameterName = thisTypePredicate;
          node.asserts = true;
          node.typeAnnotation = null;
          thisTypePredicate = this.finishNode(node, "TSTypePredicate");
        } else {
          this.resetStartLocationFromNode(thisTypePredicate, node);
          thisTypePredicate.asserts = true;
        }
        t.typeAnnotation = thisTypePredicate;
        return this.finishNode(t, "TSTypeAnnotation");
      }
      const typePredicateVariable = this.tsIsIdentifier() && this.tsTryParse(this.tsParseTypePredicatePrefix.bind(this));
      if (!typePredicateVariable) {
        if (!asserts) {
          return this.tsParseTypeAnnotation(false, t);
        }
        node.parameterName = this.parseIdentifier();
        node.asserts = asserts;
        node.typeAnnotation = null;
        t.typeAnnotation = this.finishNode(node, "TSTypePredicate");
        return this.finishNode(t, "TSTypeAnnotation");
      }
      const type = this.tsParseTypeAnnotation(false);
      node.parameterName = typePredicateVariable;
      node.typeAnnotation = type;
      node.asserts = asserts;
      t.typeAnnotation = this.finishNode(node, "TSTypePredicate");
      return this.finishNode(t, "TSTypeAnnotation");
    });
  }
  tsTryParseTypeOrTypePredicateAnnotation() {
    if (this.match(14)) {
      return this.tsParseTypeOrTypePredicateAnnotation(14);
    }
  }
  tsTryParseTypeAnnotation() {
    if (this.match(14)) {
      return this.tsParseTypeAnnotation();
    }
  }
  tsTryParseType() {
    return this.tsEatThenParseType(14);
  }
  tsParseTypePredicatePrefix() {
    const id = this.parseIdentifier();
    if (this.isContextual(116) && !this.hasPrecedingLineBreak()) {
      this.next();
      return id;
    }
  }
  tsParseTypePredicateAsserts() {
    if (this.state.type !== 109) {
      return false;
    }
    const containsEsc = this.state.containsEsc;
    this.next();
    if (!tokenIsIdentifier(this.state.type) && !this.match(78)) {
      return false;
    }
    if (containsEsc) {
      this.raise(Errors.InvalidEscapedReservedWord, this.state.lastTokStartLoc, {
        reservedWord: "asserts"
      });
    }
    return true;
  }
  tsParseTypeAnnotation(eatColon = true, t = this.startNode()) {
    this.tsInType(() => {
      if (eatColon) this.expect(14);
      t.typeAnnotation = this.tsParseType();
    });
    return this.finishNode(t, "TSTypeAnnotation");
  }
  tsParseType() {
    assert(this.state.inType);
    const type = this.tsParseNonConditionalType();
    if (this.state.inDisallowConditionalTypesContext || this.hasPrecedingLineBreak() || !this.eat(81)) {
      return type;
    }
    const node = this.startNodeAtNode(type);
    node.checkType = type;
    node.extendsType = this.tsInDisallowConditionalTypesContext(() => this.tsParseNonConditionalType());
    this.expect(17);
    node.trueType = this.tsInAllowConditionalTypesContext(() => this.tsParseType());
    this.expect(14);
    node.falseType = this.tsInAllowConditionalTypesContext(() => this.tsParseType());
    return this.finishNode(node, "TSConditionalType");
  }
  isAbstractConstructorSignature() {
    return this.isContextual(124) && this.isLookaheadContextual("new");
  }
  tsParseNonConditionalType() {
    if (this.tsIsStartOfFunctionType()) {
      return this.tsParseFunctionOrConstructorType("TSFunctionType");
    }
    if (this.match(77)) {
      return this.tsParseFunctionOrConstructorType("TSConstructorType");
    } else if (this.isAbstractConstructorSignature()) {
      return this.tsParseFunctionOrConstructorType("TSConstructorType", true);
    }
    return this.tsParseUnionTypeOrHigher();
  }
  tsParseTypeAssertion() {
    if (this.getPluginOption("typescript", "disallowAmbiguousJSXLike")) {
      this.raise(TSErrors.ReservedTypeAssertion, this.state.startLoc);
    }
    const node = this.startNode();
    node.typeAnnotation = this.tsInType(() => {
      this.next();
      return this.match(75) ? this.tsParseTypeReference() : this.tsParseType();
    });
    this.expect(48);
    node.expression = this.parseMaybeUnary();
    return this.finishNode(node, "TSTypeAssertion");
  }
  tsParseHeritageClause(token) {
    const originalStartLoc = this.state.startLoc;
    const delimitedList = this.tsParseDelimitedList("HeritageClauseElement", () => {
      const node = this.startNode();
      node.expression = this.tsParseEntityName(1 | 2);
      if (this.match(47)) {
        node.typeParameters = this.tsParseTypeArguments();
      }
      return this.finishNode(node, "TSExpressionWithTypeArguments");
    });
    if (!delimitedList.length) {
      this.raise(TSErrors.EmptyHeritageClauseType, originalStartLoc, {
        token
      });
    }
    return delimitedList;
  }
  tsParseInterfaceDeclaration(node, properties = {}) {
    if (this.hasFollowingLineBreak()) return null;
    this.expectContextual(129);
    if (properties.declare) node.declare = true;
    if (tokenIsIdentifier(this.state.type)) {
      node.id = this.parseIdentifier();
      this.checkIdentifier(node.id, 130);
    } else {
      node.id = null;
      this.raise(TSErrors.MissingInterfaceName, this.state.startLoc);
    }
    node.typeParameters = this.tsTryParseTypeParameters(this.tsParseInOutConstModifiers);
    if (this.eat(81)) {
      node.extends = this.tsParseHeritageClause("extends");
    }
    const body = this.startNode();
    body.body = this.tsInType(this.tsParseObjectTypeMembers.bind(this));
    node.body = this.finishNode(body, "TSInterfaceBody");
    return this.finishNode(node, "TSInterfaceDeclaration");
  }
  tsParseTypeAliasDeclaration(node) {
    node.id = this.parseIdentifier();
    this.checkIdentifier(node.id, 2);
    node.typeAnnotation = this.tsInType(() => {
      node.typeParameters = this.tsTryParseTypeParameters(this.tsParseInOutModifiers);
      this.expect(29);
      if (this.isContextual(114) && this.lookaheadCharCode() !== 46) {
        const node = this.startNode();
        this.next();
        return this.finishNode(node, "TSIntrinsicKeyword");
      }
      return this.tsParseType();
    });
    this.semicolon();
    return this.finishNode(node, "TSTypeAliasDeclaration");
  }
  tsInTopLevelContext(cb) {
    if (this.curContext() !== types.brace) {
      const oldContext = this.state.context;
      this.state.context = [oldContext[0]];
      try {
        return cb();
      } finally {
        this.state.context = oldContext;
      }
    } else {
      return cb();
    }
  }
  tsInType(cb) {
    const oldInType = this.state.inType;
    this.state.inType = true;
    try {
      return cb();
    } finally {
      this.state.inType = oldInType;
    }
  }
  tsInDisallowConditionalTypesContext(cb) {
    const oldInDisallowConditionalTypesContext = this.state.inDisallowConditionalTypesContext;
    this.state.inDisallowConditionalTypesContext = true;
    try {
      return cb();
    } finally {
      this.state.inDisallowConditionalTypesContext = oldInDisallowConditionalTypesContext;
    }
  }
  tsInAllowConditionalTypesContext(cb) {
    const oldInDisallowConditionalTypesContext = this.state.inDisallowConditionalTypesContext;
    this.state.inDisallowConditionalTypesContext = false;
    try {
      return cb();
    } finally {
      this.state.inDisallowConditionalTypesContext = oldInDisallowConditionalTypesContext;
    }
  }
  tsEatThenParseType(token) {
    if (this.match(token)) {
      return this.tsNextThenParseType();
    }
  }
  tsExpectThenParseType(token) {
    return this.tsInType(() => {
      this.expect(token);
      return this.tsParseType();
    });
  }
  tsNextThenParseType() {
    return this.tsInType(() => {
      this.next();
      return this.tsParseType();
    });
  }
  tsParseEnumMember() {
    const node = this.startNode();
    node.id = this.match(134) ? super.parseStringLiteral(this.state.value) : this.parseIdentifier(true);
    if (this.eat(29)) {
      node.initializer = super.parseMaybeAssignAllowIn();
    }
    return this.finishNode(node, "TSEnumMember");
  }
  tsParseEnumDeclaration(node, properties = {}) {
    if (properties.const) node.const = true;
    if (properties.declare) node.declare = true;
    this.expectContextual(126);
    node.id = this.parseIdentifier();
    this.checkIdentifier(node.id, node.const ? 8971 : 8459);
    this.expect(5);
    node.members = this.tsParseDelimitedList("EnumMembers", this.tsParseEnumMember.bind(this));
    this.expect(8);
    return this.finishNode(node, "TSEnumDeclaration");
  }
  tsParseEnumBody() {
    const node = this.startNode();
    this.expect(5);
    node.members = this.tsParseDelimitedList("EnumMembers", this.tsParseEnumMember.bind(this));
    this.expect(8);
    return this.finishNode(node, "TSEnumBody");
  }
  tsParseModuleBlock() {
    const node = this.startNode();
    this.scope.enter(0);
    this.expect(5);
    super.parseBlockOrModuleBlockBody(node.body = [], undefined, true, 8);
    this.scope.exit();
    return this.finishNode(node, "TSModuleBlock");
  }
  tsParseModuleOrNamespaceDeclaration(node, nested = false) {
    node.id = this.parseIdentifier();
    if (!nested) {
      this.checkIdentifier(node.id, 1024);
    }
    if (this.eat(16)) {
      const inner = this.startNode();
      this.tsParseModuleOrNamespaceDeclaration(inner, true);
      node.body = inner;
    } else {
      this.scope.enter(1024);
      this.prodParam.enter(0);
      node.body = this.tsParseModuleBlock();
      this.prodParam.exit();
      this.scope.exit();
    }
    return this.finishNode(node, "TSModuleDeclaration");
  }
  tsParseAmbientExternalModuleDeclaration(node) {
    if (this.isContextual(112)) {
      node.kind = "global";
      node.global = true;
      node.id = this.parseIdentifier();
    } else if (this.match(134)) {
      node.kind = "module";
      node.id = super.parseStringLiteral(this.state.value);
    } else {
      this.unexpected();
    }
    if (this.match(5)) {
      this.scope.enter(1024);
      this.prodParam.enter(0);
      node.body = this.tsParseModuleBlock();
      this.prodParam.exit();
      this.scope.exit();
    } else {
      this.semicolon();
    }
    return this.finishNode(node, "TSModuleDeclaration");
  }
  tsParseImportEqualsDeclaration(node, maybeDefaultIdentifier, isExport) {
    node.isExport = isExport || false;
    node.id = maybeDefaultIdentifier || this.parseIdentifier();
    this.checkIdentifier(node.id, 4096);
    this.expect(29);
    const moduleReference = this.tsParseModuleReference();
    if (node.importKind === "type" && moduleReference.type !== "TSExternalModuleReference") {
      this.raise(TSErrors.ImportAliasHasImportType, moduleReference);
    }
    node.moduleReference = moduleReference;
    this.semicolon();
    return this.finishNode(node, "TSImportEqualsDeclaration");
  }
  tsIsExternalModuleReference() {
    return this.isContextual(119) && this.lookaheadCharCode() === 40;
  }
  tsParseModuleReference() {
    return this.tsIsExternalModuleReference() ? this.tsParseExternalModuleReference() : this.tsParseEntityName(0);
  }
  tsParseExternalModuleReference() {
    const node = this.startNode();
    this.expectContextual(119);
    this.expect(10);
    if (!this.match(134)) {
      this.unexpected();
    }
    node.expression = super.parseExprAtom();
    this.expect(11);
    this.sawUnambiguousESM = true;
    return this.finishNode(node, "TSExternalModuleReference");
  }
  tsLookAhead(f) {
    const state = this.state.clone();
    const res = f();
    this.state = state;
    return res;
  }
  tsTryParseAndCatch(f) {
    const result = this.tryParse(abort => f() || abort());
    if (result.aborted || !result.node) return;
    if (result.error) this.state = result.failState;
    return result.node;
  }
  tsTryParse(f) {
    const state = this.state.clone();
    const result = f();
    if (result !== undefined && result !== false) {
      return result;
    }
    this.state = state;
  }
  tsTryParseDeclare(node) {
    if (this.isLineTerminator()) {
      return;
    }
    const startType = this.state.type;
    return this.tsInAmbientContext(() => {
      switch (startType) {
        case 68:
          node.declare = true;
          return super.parseFunctionStatement(node, false, false);
        case 80:
          node.declare = true;
          return this.parseClass(node, true, false);
        case 126:
          return this.tsParseEnumDeclaration(node, {
            declare: true
          });
        case 112:
          return this.tsParseAmbientExternalModuleDeclaration(node);
        case 100:
          if (this.state.containsEsc) {
            return;
          }
        case 75:
        case 74:
          if (!this.match(75) || !this.isLookaheadContextual("enum")) {
            node.declare = true;
            return this.parseVarStatement(node, this.state.value, true);
          }
          this.expect(75);
          return this.tsParseEnumDeclaration(node, {
            const: true,
            declare: true
          });
        case 107:
          if (this.isUsing()) {
            this.raise(TSErrors.InvalidModifierOnUsingDeclaration, this.state.startLoc, "declare");
            node.declare = true;
            return this.parseVarStatement(node, "using", true);
          }
          break;
        case 96:
          if (this.isAwaitUsing()) {
            this.raise(TSErrors.InvalidModifierOnAwaitUsingDeclaration, this.state.startLoc, "declare");
            node.declare = true;
            this.next();
            return this.parseVarStatement(node, "await using", true);
          }
          break;
        case 129:
          {
            const result = this.tsParseInterfaceDeclaration(node, {
              declare: true
            });
            if (result) return result;
          }
        default:
          if (tokenIsIdentifier(startType)) {
            return this.tsParseDeclaration(node, this.state.type, true, null);
          }
      }
    });
  }
  tsTryParseExportDeclaration() {
    return this.tsParseDeclaration(this.startNode(), this.state.type, true, null);
  }
  tsParseDeclaration(node, type, next, decorators) {
    switch (type) {
      case 124:
        if (this.tsCheckLineTerminator(next) && (this.match(80) || tokenIsIdentifier(this.state.type))) {
          return this.tsParseAbstractDeclaration(node, decorators);
        }
        break;
      case 127:
        if (this.tsCheckLineTerminator(next)) {
          if (this.match(134)) {
            return this.tsParseAmbientExternalModuleDeclaration(node);
          } else if (tokenIsIdentifier(this.state.type)) {
            node.kind = "module";
            return this.tsParseModuleOrNamespaceDeclaration(node);
          }
        }
        break;
      case 128:
        if (this.tsCheckLineTerminator(next) && tokenIsIdentifier(this.state.type)) {
          node.kind = "namespace";
          return this.tsParseModuleOrNamespaceDeclaration(node);
        }
        break;
      case 130:
        if (this.tsCheckLineTerminator(next) && tokenIsIdentifier(this.state.type)) {
          return this.tsParseTypeAliasDeclaration(node);
        }
        break;
    }
  }
  tsCheckLineTerminator(next) {
    if (next) {
      if (this.hasFollowingLineBreak()) return false;
      this.next();
      return true;
    }
    return !this.isLineTerminator();
  }
  tsTryParseGenericAsyncArrowFunction(startLoc) {
    if (!this.match(47)) return;
    const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
    this.state.maybeInArrowParameters = true;
    const res = this.tsTryParseAndCatch(() => {
      const node = this.startNodeAt(startLoc);
      node.typeParameters = this.tsParseTypeParameters(this.tsParseConstModifier);
      super.parseFunctionParams(node);
      node.returnType = this.tsTryParseTypeOrTypePredicateAnnotation();
      this.expect(19);
      return node;
    });
    this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
    if (!res) return;
    return super.parseArrowExpression(res, null, true);
  }
  tsParseTypeArgumentsInExpression() {
    if (this.reScan_lt() !== 47) return;
    return this.tsParseTypeArguments();
  }
  tsParseTypeArguments() {
    const node = this.startNode();
    node.params = this.tsInType(() => this.tsInTopLevelContext(() => {
      this.expect(47);
      return this.tsParseDelimitedList("TypeParametersOrArguments", this.tsParseType.bind(this));
    }));
    if (node.params.length === 0) {
      this.raise(TSErrors.EmptyTypeArguments, node);
    } else if (!this.state.inType && this.curContext() === types.brace) {
      this.reScan_lt_gt();
    }
    this.expect(48);
    return this.finishNode(node, "TSTypeParameterInstantiation");
  }
  tsIsDeclarationStart() {
    return tokenIsTSDeclarationStart(this.state.type);
  }
  isExportDefaultSpecifier() {
    if (this.tsIsDeclarationStart()) return false;
    return super.isExportDefaultSpecifier();
  }
  parseBindingElement(flags, decorators) {
    const startLoc = decorators.length ? decorators[0].loc.start : this.state.startLoc;
    const modified = {};
    this.tsParseModifiers({
      allowedModifiers: ["public", "private", "protected", "override", "readonly"]
    }, modified);
    const accessibility = modified.accessibility;
    const override = modified.override;
    const readonly = modified.readonly;
    if (!(flags & 4) && (accessibility || readonly || override)) {
      this.raise(TSErrors.UnexpectedParameterModifier, startLoc);
    }
    const left = this.parseMaybeDefault();
    if (flags & 2) {
      this.parseFunctionParamType(left);
    }
    const elt = this.parseMaybeDefault(left.loc.start, left);
    if (accessibility || readonly || override) {
      const pp = this.startNodeAt(startLoc);
      if (decorators.length) {
        pp.decorators = decorators;
      }
      if (accessibility) pp.accessibility = accessibility;
      if (readonly) pp.readonly = readonly;
      if (override) pp.override = override;
      if (elt.type !== "Identifier" && elt.type !== "AssignmentPattern") {
        this.raise(TSErrors.UnsupportedParameterPropertyKind, pp);
      }
      pp.parameter = elt;
      return this.finishNode(pp, "TSParameterProperty");
    }
    if (decorators.length) {
      left.decorators = decorators;
    }
    return elt;
  }
  isSimpleParameter(node) {
    return node.type === "TSParameterProperty" && super.isSimpleParameter(node.parameter) || super.isSimpleParameter(node);
  }
  tsDisallowOptionalPattern(node) {
    for (const param of node.params) {
      if (param.type !== "Identifier" && param.optional && !this.state.isAmbientContext) {
        this.raise(TSErrors.PatternIsOptional, param);
      }
    }
  }
  setArrowFunctionParameters(node, params, trailingCommaLoc) {
    super.setArrowFunctionParameters(node, params, trailingCommaLoc);
    this.tsDisallowOptionalPattern(node);
  }
  parseFunctionBodyAndFinish(node, type, isMethod = false) {
    if (this.match(14)) {
      node.returnType = this.tsParseTypeOrTypePredicateAnnotation(14);
    }
    const bodilessType = type === "FunctionDeclaration" ? "TSDeclareFunction" : type === "ClassMethod" || type === "ClassPrivateMethod" ? "TSDeclareMethod" : undefined;
    if (bodilessType && !this.match(5) && this.isLineTerminator()) {
      return this.finishNode(node, bodilessType);
    }
    if (bodilessType === "TSDeclareFunction" && this.state.isAmbientContext) {
      this.raise(TSErrors.DeclareFunctionHasImplementation, node);
      if (node.declare) {
        return super.parseFunctionBodyAndFinish(node, bodilessType, isMethod);
      }
    }
    this.tsDisallowOptionalPattern(node);
    return super.parseFunctionBodyAndFinish(node, type, isMethod);
  }
  registerFunctionStatementId(node) {
    if (!node.body && node.id) {
      this.checkIdentifier(node.id, 1024);
    } else {
      super.registerFunctionStatementId(node);
    }
  }
  tsCheckForInvalidTypeCasts(items) {
    items.forEach(node => {
      if ((node == null ? void 0 : node.type) === "TSTypeCastExpression") {
        this.raise(TSErrors.UnexpectedTypeAnnotation, node.typeAnnotation);
      }
    });
  }
  toReferencedList(exprList, isInParens) {
    this.tsCheckForInvalidTypeCasts(exprList);
    return exprList;
  }
  parseArrayLike(close, isTuple, refExpressionErrors) {
    const node = super.parseArrayLike(close, isTuple, refExpressionErrors);
    if (node.type === "ArrayExpression") {
      this.tsCheckForInvalidTypeCasts(node.elements);
    }
    return node;
  }
  parseSubscript(base, startLoc, noCalls, state) {
    if (!this.hasPrecedingLineBreak() && this.match(35)) {
      this.state.canStartJSXElement = false;
      this.next();
      const nonNullExpression = this.startNodeAt(startLoc);
      nonNullExpression.expression = base;
      return this.finishNode(nonNullExpression, "TSNonNullExpression");
    }
    let isOptionalCall = false;
    if (this.match(18) && this.lookaheadCharCode() === 60) {
      if (noCalls) {
        state.stop = true;
        return base;
      }
      state.optionalChainMember = isOptionalCall = true;
      this.next();
    }
    if (this.match(47) || this.match(51)) {
      let missingParenErrorLoc;
      const result = this.tsTryParseAndCatch(() => {
        if (!noCalls && this.atPossibleAsyncArrow(base)) {
          const asyncArrowFn = this.tsTryParseGenericAsyncArrowFunction(startLoc);
          if (asyncArrowFn) {
            state.stop = true;
            return asyncArrowFn;
          }
        }
        const typeArguments = this.tsParseTypeArgumentsInExpression();
        if (!typeArguments) return;
        if (isOptionalCall && !this.match(10)) {
          missingParenErrorLoc = this.state.curPosition();
          return;
        }
        if (tokenIsTemplate(this.state.type)) {
          const result = super.parseTaggedTemplateExpression(base, startLoc, state);
          result.typeParameters = typeArguments;
          return result;
        }
        if (!noCalls && this.eat(10)) {
          const node = this.startNodeAt(startLoc);
          node.callee = base;
          node.arguments = this.parseCallExpressionArguments();
          this.tsCheckForInvalidTypeCasts(node.arguments);
          node.typeParameters = typeArguments;
          if (state.optionalChainMember) {
            node.optional = isOptionalCall;
          }
          return this.finishCallExpression(node, state.optionalChainMember);
        }
        const tokenType = this.state.type;
        if (tokenType === 48 || tokenType === 52 || tokenType !== 10 && tokenType !== 93 && tokenType !== 120 && tokenCanStartExpression(tokenType) && !this.hasPrecedingLineBreak()) {
          return;
        }
        const node = this.startNodeAt(startLoc);
        node.expression = base;
        node.typeParameters = typeArguments;
        return this.finishNode(node, "TSInstantiationExpression");
      });
      if (missingParenErrorLoc) {
        this.unexpected(missingParenErrorLoc, 10);
      }
      if (result) {
        if (result.type === "TSInstantiationExpression") {
          if (this.match(16) || this.match(18) && this.lookaheadCharCode() !== 40) {
            this.raise(TSErrors.InvalidPropertyAccessAfterInstantiationExpression, this.state.startLoc);
          }
          if (!this.match(16) && !this.match(18)) {
            result.expression = super.stopParseSubscript(base, state);
          }
        }
        return result;
      }
    }
    return super.parseSubscript(base, startLoc, noCalls, state);
  }
  parseNewCallee(node) {
    var _callee$extra;
    super.parseNewCallee(node);
    const {
      callee
    } = node;
    if (callee.type === "TSInstantiationExpression" && !((_callee$extra = callee.extra) != null && _callee$extra.parenthesized)) {
      node.typeParameters = callee.typeParameters;
      node.callee = callee.expression;
    }
  }
  parseExprOp(left, leftStartLoc, minPrec) {
    let isSatisfies;
    if (tokenOperatorPrecedence(58) > minPrec && !this.hasPrecedingLineBreak() && (this.isContextual(93) || (isSatisfies = this.isContextual(120)))) {
      const node = this.startNodeAt(leftStartLoc);
      node.expression = left;
      node.typeAnnotation = this.tsInType(() => {
        this.next();
        if (this.match(75)) {
          if (isSatisfies) {
            this.raise(Errors.UnexpectedKeyword, this.state.startLoc, {
              keyword: "const"
            });
          }
          return this.tsParseTypeReference();
        }
        return this.tsParseType();
      });
      this.finishNode(node, isSatisfies ? "TSSatisfiesExpression" : "TSAsExpression");
      this.reScan_lt_gt();
      return this.parseExprOp(node, leftStartLoc, minPrec);
    }
    return super.parseExprOp(left, leftStartLoc, minPrec);
  }
  checkReservedWord(word, startLoc, checkKeywords, isBinding) {
    if (!this.state.isAmbientContext) {
      super.checkReservedWord(word, startLoc, checkKeywords, isBinding);
    }
  }
  checkImportReflection(node) {
    super.checkImportReflection(node);
    if (node.module && node.importKind !== "value") {
      this.raise(TSErrors.ImportReflectionHasImportType, node.specifiers[0].loc.start);
    }
  }
  checkDuplicateExports() {}
  isPotentialImportPhase(isExport) {
    if (super.isPotentialImportPhase(isExport)) return true;
    if (this.isContextual(130)) {
      const ch = this.lookaheadCharCode();
      return isExport ? ch === 123 || ch === 42 : ch !== 61;
    }
    return !isExport && this.isContextual(87);
  }
  applyImportPhase(node, isExport, phase, loc) {
    super.applyImportPhase(node, isExport, phase, loc);
    if (isExport) {
      node.exportKind = phase === "type" ? "type" : "value";
    } else {
      node.importKind = phase === "type" || phase === "typeof" ? phase : "value";
    }
  }
  parseImport(node) {
    if (this.match(134)) {
      node.importKind = "value";
      return super.parseImport(node);
    }
    let importNode;
    if (tokenIsIdentifier(this.state.type) && this.lookaheadCharCode() === 61) {
      node.importKind = "value";
      return this.tsParseImportEqualsDeclaration(node);
    } else if (this.isContextual(130)) {
      const maybeDefaultIdentifier = this.parseMaybeImportPhase(node, false);
      if (this.lookaheadCharCode() === 61) {
        return this.tsParseImportEqualsDeclaration(node, maybeDefaultIdentifier);
      } else {
        importNode = super.parseImportSpecifiersAndAfter(node, maybeDefaultIdentifier);
      }
    } else {
      importNode = super.parseImport(node);
    }
    if (importNode.importKind === "type" && importNode.specifiers.length > 1 && importNode.specifiers[0].type === "ImportDefaultSpecifier") {
      this.raise(TSErrors.TypeImportCannotSpecifyDefaultAndNamed, importNode);
    }
    return importNode;
  }
  parseExport(node, decorators) {
    if (this.match(83)) {
      const nodeImportEquals = node;
      this.next();
      let maybeDefaultIdentifier = null;
      if (this.isContextual(130) && this.isPotentialImportPhase(false)) {
        maybeDefaultIdentifier = this.parseMaybeImportPhase(nodeImportEquals, false);
      } else {
        nodeImportEquals.importKind = "value";
      }
      const declaration = this.tsParseImportEqualsDeclaration(nodeImportEquals, maybeDefaultIdentifier, true);
      return declaration;
    } else if (this.eat(29)) {
      const assign = node;
      assign.expression = super.parseExpression();
      this.semicolon();
      this.sawUnambiguousESM = true;
      return this.finishNode(assign, "TSExportAssignment");
    } else if (this.eatContextual(93)) {
      const decl = node;
      this.expectContextual(128);
      decl.id = this.parseIdentifier();
      this.semicolon();
      return this.finishNode(decl, "TSNamespaceExportDeclaration");
    } else {
      return super.parseExport(node, decorators);
    }
  }
  isAbstractClass() {
    return this.isContextual(124) && this.isLookaheadContextual("class");
  }
  parseExportDefaultExpression() {
    if (this.isAbstractClass()) {
      const cls = this.startNode();
      this.next();
      cls.abstract = true;
      return this.parseClass(cls, true, true);
    }
    if (this.match(129)) {
      const result = this.tsParseInterfaceDeclaration(this.startNode());
      if (result) return result;
    }
    return super.parseExportDefaultExpression();
  }
  parseVarStatement(node, kind, allowMissingInitializer = false) {
    const {
      isAmbientContext
    } = this.state;
    const declaration = super.parseVarStatement(node, kind, allowMissingInitializer || isAmbientContext);
    if (!isAmbientContext) return declaration;
    if (!node.declare && (kind === "using" || kind === "await using")) {
      this.raiseOverwrite(TSErrors.UsingDeclarationInAmbientContext, node, kind);
      return declaration;
    }
    for (const {
      id,
      init
    } of declaration.declarations) {
      if (!init) continue;
      if (kind === "var" || kind === "let" || !!id.typeAnnotation) {
        this.raise(TSErrors.InitializerNotAllowedInAmbientContext, init);
      } else if (!isValidAmbientConstInitializer(init, this.hasPlugin("estree"))) {
        this.raise(TSErrors.ConstInitializerMustBeStringOrNumericLiteralOrLiteralEnumReference, init);
      }
    }
    return declaration;
  }
  parseStatementContent(flags, decorators) {
    if (!this.state.containsEsc) {
      switch (this.state.type) {
        case 75:
          {
            if (this.isLookaheadContextual("enum")) {
              const node = this.startNode();
              this.expect(75);
              return this.tsParseEnumDeclaration(node, {
                const: true
              });
            }
            break;
          }
        case 124:
        case 125:
          {
            if (this.nextTokenIsIdentifierAndNotTSRelationalOperatorOnSameLine()) {
              const token = this.state.type;
              const node = this.startNode();
              this.next();
              const declaration = token === 125 ? this.tsTryParseDeclare(node) : this.tsParseAbstractDeclaration(node, decorators);
              if (declaration) {
                if (token === 125) {
                  declaration.declare = true;
                }
                return declaration;
              } else {
                node.expression = this.createIdentifier(this.startNodeAt(node.loc.start), token === 125 ? "declare" : "abstract");
                this.semicolon(false);
                return this.finishNode(node, "ExpressionStatement");
              }
            }
            break;
          }
        case 126:
          return this.tsParseEnumDeclaration(this.startNode());
        case 112:
          {
            const nextCh = this.lookaheadCharCode();
            if (nextCh === 123) {
              const node = this.startNode();
              return this.tsParseAmbientExternalModuleDeclaration(node);
            }
            break;
          }
        case 129:
          {
            const result = this.tsParseInterfaceDeclaration(this.startNode());
            if (result) return result;
            break;
          }
        case 127:
          {
            if (this.nextTokenIsIdentifierOrStringLiteralOnSameLine()) {
              const node = this.startNode();
              this.next();
              return this.tsParseDeclaration(node, 127, false, decorators);
            }
            break;
          }
        case 128:
          {
            if (this.nextTokenIsIdentifierOnSameLine()) {
              const node = this.startNode();
              this.next();
              return this.tsParseDeclaration(node, 128, false, decorators);
            }
            break;
          }
        case 130:
          {
            if (this.nextTokenIsIdentifierOnSameLine()) {
              const node = this.startNode();
              this.next();
              return this.tsParseTypeAliasDeclaration(node);
            }
            break;
          }
      }
    }
    return super.parseStatementContent(flags, decorators);
  }
  parseAccessModifier() {
    return this.tsParseModifier(["public", "protected", "private"]);
  }
  tsHasSomeModifiers(member, modifiers) {
    return modifiers.some(modifier => {
      if (tsIsAccessModifier(modifier)) {
        return member.accessibility === modifier;
      }
      return !!member[modifier];
    });
  }
  tsIsStartOfStaticBlocks() {
    return this.isContextual(106) && this.lookaheadCharCode() === 123;
  }
  parseClassMember(classBody, member, state) {
    const modifiers = ["declare", "private", "public", "protected", "override", "abstract", "readonly", "static"];
    this.tsParseModifiers({
      allowedModifiers: modifiers,
      disallowedModifiers: ["in", "out"],
      stopOnStartOfClassStaticBlock: true,
      errorTemplate: TSErrors.InvalidModifierOnTypeParameterPositions
    }, member);
    const callParseClassMemberWithIsStatic = () => {
      if (this.tsIsStartOfStaticBlocks()) {
        this.next();
        this.next();
        if (this.tsHasSomeModifiers(member, modifiers)) {
          this.raise(TSErrors.StaticBlockCannotHaveModifier, this.state.curPosition());
        }
        super.parseClassStaticBlock(classBody, member);
      } else {
        this.parseClassMemberWithIsStatic(classBody, member, state, !!member.static);
      }
    };
    if (member.declare) {
      this.tsInAmbientContext(callParseClassMemberWithIsStatic);
    } else {
      callParseClassMemberWithIsStatic();
    }
  }
  parseClassMemberWithIsStatic(classBody, member, state, isStatic) {
    const idx = this.tsTryParseIndexSignature(member);
    if (idx) {
      classBody.body.push(idx);
      if (member.abstract) {
        this.raise(TSErrors.IndexSignatureHasAbstract, member);
      }
      if (member.accessibility) {
        this.raise(TSErrors.IndexSignatureHasAccessibility, member, {
          modifier: member.accessibility
        });
      }
      if (member.declare) {
        this.raise(TSErrors.IndexSignatureHasDeclare, member);
      }
      if (member.override) {
        this.raise(TSErrors.IndexSignatureHasOverride, member);
      }
      return;
    }
    if (!this.state.inAbstractClass && member.abstract) {
      this.raise(TSErrors.NonAbstractClassHasAbstractMethod, member);
    }
    if (member.override) {
      if (!state.hadSuperClass) {
        this.raise(TSErrors.OverrideNotInSubClass, member);
      }
    }
    super.parseClassMemberWithIsStatic(classBody, member, state, isStatic);
  }
  parsePostMemberNameModifiers(methodOrProp) {
    const optional = this.eat(17);
    if (optional) methodOrProp.optional = true;
    if (methodOrProp.readonly && this.match(10)) {
      this.raise(TSErrors.ClassMethodHasReadonly, methodOrProp);
    }
    if (methodOrProp.declare && this.match(10)) {
      this.raise(TSErrors.ClassMethodHasDeclare, methodOrProp);
    }
  }
  shouldParseExportDeclaration() {
    if (this.tsIsDeclarationStart()) return true;
    return super.shouldParseExportDeclaration();
  }
  parseConditional(expr, startLoc, refExpressionErrors) {
    if (!this.match(17)) return expr;
    if (this.state.maybeInArrowParameters) {
      const nextCh = this.lookaheadCharCode();
      if (nextCh === 44 || nextCh === 61 || nextCh === 58 || nextCh === 41) {
        this.setOptionalParametersError(refExpressionErrors);
        return expr;
      }
    }
    return super.parseConditional(expr, startLoc, refExpressionErrors);
  }
  parseParenItem(node, startLoc) {
    const newNode = super.parseParenItem(node, startLoc);
    if (this.eat(17)) {
      newNode.optional = true;
      this.resetEndLocation(node);
    }
    if (this.match(14)) {
      const typeCastNode = this.startNodeAt(startLoc);
      typeCastNode.expression = node;
      typeCastNode.typeAnnotation = this.tsParseTypeAnnotation();
      return this.finishNode(typeCastNode, "TSTypeCastExpression");
    }
    return node;
  }
  parseExportDeclaration(node) {
    if (!this.state.isAmbientContext && this.isContextual(125)) {
      return this.tsInAmbientContext(() => this.parseExportDeclaration(node));
    }
    const startLoc = this.state.startLoc;
    const isDeclare = this.eatContextual(125);
    if (isDeclare && (this.isContextual(125) || !this.shouldParseExportDeclaration())) {
      throw this.raise(TSErrors.ExpectedAmbientAfterExportDeclare, this.state.startLoc);
    }
    const isIdentifier = tokenIsIdentifier(this.state.type);
    const declaration = isIdentifier && this.tsTryParseExportDeclaration() || super.parseExportDeclaration(node);
    if (!declaration) return null;
    if (declaration.type === "TSInterfaceDeclaration" || declaration.type === "TSTypeAliasDeclaration" || isDeclare) {
      node.exportKind = "type";
    }
    if (isDeclare && declaration.type !== "TSImportEqualsDeclaration") {
      this.resetStartLocation(declaration, startLoc);
      declaration.declare = true;
    }
    return declaration;
  }
  parseClassId(node, isStatement, optionalId, bindingType) {
    if ((!isStatement || optionalId) && this.isContextual(113)) {
      return;
    }
    super.parseClassId(node, isStatement, optionalId, node.declare ? 1024 : 8331);
    const typeParameters = this.tsTryParseTypeParameters(this.tsParseInOutConstModifiers);
    if (typeParameters) node.typeParameters = typeParameters;
  }
  parseClassPropertyAnnotation(node) {
    if (!node.optional) {
      if (this.eat(35)) {
        node.definite = true;
      } else if (this.eat(17)) {
        node.optional = true;
      }
    }
    const type = this.tsTryParseTypeAnnotation();
    if (type) node.typeAnnotation = type;
  }
  parseClassProperty(node) {
    this.parseClassPropertyAnnotation(node);
    if (this.state.isAmbientContext && !(node.readonly && !node.typeAnnotation) && this.match(29)) {
      this.raise(TSErrors.DeclareClassFieldHasInitializer, this.state.startLoc);
    }
    if (node.abstract && this.match(29)) {
      const {
        key
      } = node;
      this.raise(TSErrors.AbstractPropertyHasInitializer, this.state.startLoc, {
        propertyName: key.type === "Identifier" && !node.computed ? key.name : `[${this.input.slice(this.offsetToSourcePos(key.start), this.offsetToSourcePos(key.end))}]`
      });
    }
    return super.parseClassProperty(node);
  }
  parseClassPrivateProperty(node) {
    if (node.abstract) {
      this.raise(TSErrors.PrivateElementHasAbstract, node);
    }
    if (node.accessibility) {
      this.raise(TSErrors.PrivateElementHasAccessibility, node, {
        modifier: node.accessibility
      });
    }
    this.parseClassPropertyAnnotation(node);
    return super.parseClassPrivateProperty(node);
  }
  parseClassAccessorProperty(node) {
    this.parseClassPropertyAnnotation(node);
    if (node.optional) {
      this.raise(TSErrors.AccessorCannotBeOptional, node);
    }
    return super.parseClassAccessorProperty(node);
  }
  pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper) {
    const typeParameters = this.tsTryParseTypeParameters(this.tsParseConstModifier);
    if (typeParameters && isConstructor) {
      this.raise(TSErrors.ConstructorHasTypeParameters, typeParameters);
    }
    const {
      declare = false,
      kind
    } = method;
    if (declare && (kind === "get" || kind === "set")) {
      this.raise(TSErrors.DeclareAccessor, method, {
        kind
      });
    }
    if (typeParameters) method.typeParameters = typeParameters;
    super.pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper);
  }
  pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
    const typeParameters = this.tsTryParseTypeParameters(this.tsParseConstModifier);
    if (typeParameters) method.typeParameters = typeParameters;
    super.pushClassPrivateMethod(classBody, method, isGenerator, isAsync);
  }
  declareClassPrivateMethodInScope(node, kind) {
    if (node.type === "TSDeclareMethod") return;
    if (node.type === "MethodDefinition" && node.value.body == null) {
      return;
    }
    super.declareClassPrivateMethodInScope(node, kind);
  }
  parseClassSuper(node) {
    super.parseClassSuper(node);
    if (node.superClass) {
      if (node.superClass.type === "TSInstantiationExpression") {
        const tsInstantiationExpression = node.superClass;
        const superClass = tsInstantiationExpression.expression;
        this.takeSurroundingComments(superClass, superClass.start, superClass.end);
        const superTypeArguments = tsInstantiationExpression.typeParameters;
        this.takeSurroundingComments(superTypeArguments, superTypeArguments.start, superTypeArguments.end);
        node.superClass = superClass;
        node.superTypeParameters = superTypeArguments;
      } else if (this.match(47) || this.match(51)) {
        node.superTypeParameters = this.tsParseTypeArgumentsInExpression();
      }
    }
    if (this.eatContextual(113)) {
      node.implements = this.tsParseHeritageClause("implements");
    }
  }
  parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors) {
    const typeParameters = this.tsTryParseTypeParameters(this.tsParseConstModifier);
    if (typeParameters) prop.typeParameters = typeParameters;
    return super.parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors);
  }
  parseFunctionParams(node, isConstructor) {
    const typeParameters = this.tsTryParseTypeParameters(this.tsParseConstModifier);
    if (typeParameters) node.typeParameters = typeParameters;
    super.parseFunctionParams(node, isConstructor);
  }
  parseVarId(decl, kind) {
    super.parseVarId(decl, kind);
    if (decl.id.type === "Identifier" && !this.hasPrecedingLineBreak() && this.eat(35)) {
      decl.definite = true;
    }
    const type = this.tsTryParseTypeAnnotation();
    if (type) {
      decl.id.typeAnnotation = type;
      this.resetEndLocation(decl.id);
    }
  }
  parseAsyncArrowFromCallExpression(node, call) {
    if (this.match(14)) {
      node.returnType = this.tsParseTypeAnnotation();
    }
    return super.parseAsyncArrowFromCallExpression(node, call);
  }
  parseMaybeAssign(refExpressionErrors, afterLeftParse) {
    var _jsx, _jsx2, _typeCast, _jsx3, _typeCast2;
    let state;
    let jsx;
    let typeCast;
    if (this.hasPlugin("jsx") && (this.match(143) || this.match(47))) {
      state = this.state.clone();
      jsx = this.tryParse(() => super.parseMaybeAssign(refExpressionErrors, afterLeftParse), state);
      if (!jsx.error) return jsx.node;
      const {
        context
      } = this.state;
      const currentContext = context[context.length - 1];
      if (currentContext === types.j_oTag || currentContext === types.j_expr) {
        context.pop();
      }
    }
    if (!((_jsx = jsx) != null && _jsx.error) && !this.match(47)) {
      return super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
    }
    if (!state || state === this.state) state = this.state.clone();
    let typeParameters;
    const arrow = this.tryParse(abort => {
      var _expr$extra, _typeParameters;
      typeParameters = this.tsParseTypeParameters(this.tsParseConstModifier);
      const expr = super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
      if (expr.type !== "ArrowFunctionExpression" || (_expr$extra = expr.extra) != null && _expr$extra.parenthesized) {
        abort();
      }
      if (((_typeParameters = typeParameters) == null ? void 0 : _typeParameters.params.length) !== 0) {
        this.resetStartLocationFromNode(expr, typeParameters);
      }
      expr.typeParameters = typeParameters;
      return expr;
    }, state);
    if (!arrow.error && !arrow.aborted) {
      if (typeParameters) this.reportReservedArrowTypeParam(typeParameters);
      return arrow.node;
    }
    if (!jsx) {
      assert(!this.hasPlugin("jsx"));
      typeCast = this.tryParse(() => super.parseMaybeAssign(refExpressionErrors, afterLeftParse), state);
      if (!typeCast.error) return typeCast.node;
    }
    if ((_jsx2 = jsx) != null && _jsx2.node) {
      this.state = jsx.failState;
      return jsx.node;
    }
    if (arrow.node) {
      this.state = arrow.failState;
      if (typeParameters) this.reportReservedArrowTypeParam(typeParameters);
      return arrow.node;
    }
    if ((_typeCast = typeCast) != null && _typeCast.node) {
      this.state = typeCast.failState;
      return typeCast.node;
    }
    throw ((_jsx3 = jsx) == null ? void 0 : _jsx3.error) || arrow.error || ((_typeCast2 = typeCast) == null ? void 0 : _typeCast2.error);
  }
  reportReservedArrowTypeParam(node) {
    var _node$extra2;
    if (node.params.length === 1 && !node.params[0].constraint && !((_node$extra2 = node.extra) != null && _node$extra2.trailingComma) && this.getPluginOption("typescript", "disallowAmbiguousJSXLike")) {
      this.raise(TSErrors.ReservedArrowTypeParam, node);
    }
  }
  parseMaybeUnary(refExpressionErrors, sawUnary) {
    if (!this.hasPlugin("jsx") && this.match(47)) {
      return this.tsParseTypeAssertion();
    }
    return super.parseMaybeUnary(refExpressionErrors, sawUnary);
  }
  parseArrow(node) {
    if (this.match(14)) {
      const result = this.tryParse(abort => {
        const returnType = this.tsParseTypeOrTypePredicateAnnotation(14);
        if (this.canInsertSemicolon() || !this.match(19)) abort();
        return returnType;
      });
      if (result.aborted) return;
      if (!result.thrown) {
        if (result.error) this.state = result.failState;
        node.returnType = result.node;
      }
    }
    return super.parseArrow(node);
  }
  parseFunctionParamType(param) {
    if (this.eat(17)) {
      param.optional = true;
    }
    const type = this.tsTryParseTypeAnnotation();
    if (type) param.typeAnnotation = type;
    this.resetEndLocation(param);
    return param;
  }
  isAssignable(node, isBinding) {
    switch (node.type) {
      case "TSTypeCastExpression":
        return this.isAssignable(node.expression, isBinding);
      case "TSParameterProperty":
        return true;
      default:
        return super.isAssignable(node, isBinding);
    }
  }
  toAssignable(node, isLHS = false) {
    switch (node.type) {
      case "ParenthesizedExpression":
        this.toAssignableParenthesizedExpression(node, isLHS);
        break;
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "TSNonNullExpression":
      case "TSTypeAssertion":
        if (isLHS) {
          this.expressionScope.recordArrowParameterBindingError(TSErrors.UnexpectedTypeCastInParameter, node);
        } else {
          this.raise(TSErrors.UnexpectedTypeCastInParameter, node);
        }
        this.toAssignable(node.expression, isLHS);
        break;
      case "AssignmentExpression":
        if (!isLHS && node.left.type === "TSTypeCastExpression") {
          node.left = this.typeCastToParameter(node.left);
        }
      default:
        super.toAssignable(node, isLHS);
    }
  }
  toAssignableParenthesizedExpression(node, isLHS) {
    switch (node.expression.type) {
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "TSNonNullExpression":
      case "TSTypeAssertion":
      case "ParenthesizedExpression":
        this.toAssignable(node.expression, isLHS);
        break;
      default:
        super.toAssignable(node, isLHS);
    }
  }
  checkToRestConversion(node, allowPattern) {
    switch (node.type) {
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "TSTypeAssertion":
      case "TSNonNullExpression":
        this.checkToRestConversion(node.expression, false);
        break;
      default:
        super.checkToRestConversion(node, allowPattern);
    }
  }
  isValidLVal(type, disallowCallExpression, isUnparenthesizedInAssign, binding) {
    switch (type) {
      case "TSTypeCastExpression":
        return true;
      case "TSParameterProperty":
        return "parameter";
      case "TSNonNullExpression":
        return "expression";
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "TSTypeAssertion":
        return (binding !== 64 || !isUnparenthesizedInAssign) && ["expression", true];
      default:
        return super.isValidLVal(type, disallowCallExpression, isUnparenthesizedInAssign, binding);
    }
  }
  parseBindingAtom() {
    if (this.state.type === 78) {
      return this.parseIdentifier(true);
    }
    return super.parseBindingAtom();
  }
  parseMaybeDecoratorArguments(expr, startLoc) {
    if (this.match(47) || this.match(51)) {
      const typeArguments = this.tsParseTypeArgumentsInExpression();
      if (this.match(10)) {
        const call = super.parseMaybeDecoratorArguments(expr, startLoc);
        call.typeParameters = typeArguments;
        return call;
      }
      this.unexpected(null, 10);
    }
    return super.parseMaybeDecoratorArguments(expr, startLoc);
  }
  checkCommaAfterRest(close) {
    if (this.state.isAmbientContext && this.match(12) && this.lookaheadCharCode() === close) {
      this.next();
      return false;
    }
    return super.checkCommaAfterRest(close);
  }
  isClassMethod() {
    return this.match(47) || super.isClassMethod();
  }
  isClassProperty() {
    return this.match(35) || this.match(14) || super.isClassProperty();
  }
  parseMaybeDefault(startLoc, left) {
    const node = super.parseMaybeDefault(startLoc, left);
    if (node.type === "AssignmentPattern" && node.typeAnnotation && node.right.start < node.typeAnnotation.start) {
      this.raise(TSErrors.TypeAnnotationAfterAssign, node.typeAnnotation);
    }
    return node;
  }
  getTokenFromCode(code) {
    if (this.state.inType) {
      if (code === 62) {
        this.finishOp(48, 1);
        return;
      }
      if (code === 60) {
        this.finishOp(47, 1);
        return;
      }
    }
    super.getTokenFromCode(code);
  }
  reScan_lt_gt() {
    const {
      type
    } = this.state;
    if (type === 47) {
      this.state.pos -= 1;
      this.readToken_lt();
    } else if (type === 48) {
      this.state.pos -= 1;
      this.readToken_gt();
    }
  }
  reScan_lt() {
    const {
      type
    } = this.state;
    if (type === 51) {
      this.state.pos -= 2;
      this.finishOp(47, 1);
      return 47;
    }
    return type;
  }
  toAssignableListItem(exprList, index, isLHS) {
    const node = exprList[index];
    if (node.type === "TSTypeCastExpression") {
      exprList[index] = this.typeCastToParameter(node);
    }
    super.toAssignableListItem(exprList, index, isLHS);
  }
  typeCastToParameter(node) {
    node.expression.typeAnnotation = node.typeAnnotation;
    this.resetEndLocation(node.expression, node.typeAnnotation.loc.end);
    return node.expression;
  }
  shouldParseArrow(params) {
    if (this.match(14)) {
      return params.every(expr => this.isAssignable(expr, true));
    }
    return super.shouldParseArrow(params);
  }
  shouldParseAsyncArrow() {
    return this.match(14) || super.shouldParseAsyncArrow();
  }
  canHaveLeadingDecorator() {
    return super.canHaveLeadingDecorator() || this.isAbstractClass();
  }
  jsxParseOpeningElementAfterName(node) {
    if (this.match(47) || this.match(51)) {
      const typeArguments = this.tsTryParseAndCatch(() => this.tsParseTypeArgumentsInExpression());
      if (typeArguments) {
        node.typeParameters = typeArguments;
      }
    }
    return super.jsxParseOpeningElementAfterName(node);
  }
  getGetterSetterExpectedParamCount(method) {
    const baseCount = super.getGetterSetterExpectedParamCount(method);
    const params = this.getObjectOrClassMethodParams(method);
    const firstParam = params[0];
    const hasContextParam = firstParam && this.isThisParam(firstParam);
    return hasContextParam ? baseCount + 1 : baseCount;
  }
  parseCatchClauseParam() {
    const param = super.parseCatchClauseParam();
    const type = this.tsTryParseTypeAnnotation();
    if (type) {
      param.typeAnnotation = type;
      this.resetEndLocation(param);
    }
    return param;
  }
  tsInAmbientContext(cb) {
    const {
      isAmbientContext: oldIsAmbientContext,
      strict: oldStrict
    } = this.state;
    this.state.isAmbientContext = true;
    this.state.strict = false;
    try {
      return cb();
    } finally {
      this.state.isAmbientContext = oldIsAmbientContext;
      this.state.strict = oldStrict;
    }
  }
  parseClass(node, isStatement, optionalId) {
    const oldInAbstractClass = this.state.inAbstractClass;
    this.state.inAbstractClass = !!node.abstract;
    try {
      return super.parseClass(node, isStatement, optionalId);
    } finally {
      this.state.inAbstractClass = oldInAbstractClass;
    }
  }
  tsParseAbstractDeclaration(node, decorators) {
    if (this.match(80)) {
      node.abstract = true;
      return this.maybeTakeDecorators(decorators, this.parseClass(node, true, false));
    } else if (this.isContextual(129)) {
      if (!this.hasFollowingLineBreak()) {
        node.abstract = true;
        this.raise(TSErrors.NonClassMethodPropertyHasAbstractModifier, node);
        return this.tsParseInterfaceDeclaration(node);
      } else {
        return null;
      }
    }
    throw this.unexpected(null, 80);
  }
  parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope) {
    const method = super.parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope);
    if (method.abstract || method.type === "TSAbstractMethodDefinition") {
      const hasEstreePlugin = this.hasPlugin("estree");
      const methodFn = hasEstreePlugin ? method.value : method;
      if (methodFn.body) {
        const {
          key
        } = method;
        this.raise(TSErrors.AbstractMethodHasImplementation, method, {
          methodName: key.type === "Identifier" && !method.computed ? key.name : `[${this.input.slice(this.offsetToSourcePos(key.start), this.offsetToSourcePos(key.end))}]`
        });
      }
    }
    return method;
  }
  tsParseTypeParameterName() {
    const typeName = this.parseIdentifier();
    return typeName.name;
  }
  shouldParseAsAmbientContext() {
    return !!this.getPluginOption("typescript", "dts");
  }
  parse() {
    if (this.shouldParseAsAmbientContext()) {
      this.state.isAmbientContext = true;
    }
    return super.parse();
  }
  getExpression() {
    if (this.shouldParseAsAmbientContext()) {
      this.state.isAmbientContext = true;
    }
    return super.getExpression();
  }
  parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly) {
    if (!isString && isMaybeTypeOnly) {
      this.parseTypeOnlyImportExportSpecifier(node, false, isInTypeExport);
      return this.finishNode(node, "ExportSpecifier");
    }
    node.exportKind = "value";
    return super.parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly);
  }
  parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, bindingType) {
    if (!importedIsString && isMaybeTypeOnly) {
      this.parseTypeOnlyImportExportSpecifier(specifier, true, isInTypeOnlyImport);
      return this.finishNode(specifier, "ImportSpecifier");
    }
    specifier.importKind = "value";
    return super.parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, isInTypeOnlyImport ? 4098 : 4096);
  }
  parseTypeOnlyImportExportSpecifier(node, isImport, isInTypeOnlyImportExport) {
    const leftOfAsKey = isImport ? "imported" : "local";
    const rightOfAsKey = isImport ? "local" : "exported";
    let leftOfAs = node[leftOfAsKey];
    let rightOfAs;
    let hasTypeSpecifier = false;
    let canParseAsKeyword = true;
    const loc = leftOfAs.loc.start;
    if (this.isContextual(93)) {
      const firstAs = this.parseIdentifier();
      if (this.isContextual(93)) {
        const secondAs = this.parseIdentifier();
        if (tokenIsKeywordOrIdentifier(this.state.type)) {
          hasTypeSpecifier = true;
          leftOfAs = firstAs;
          rightOfAs = isImport ? this.parseIdentifier() : this.parseModuleExportName();
          canParseAsKeyword = false;
        } else {
          rightOfAs = secondAs;
          canParseAsKeyword = false;
        }
      } else if (tokenIsKeywordOrIdentifier(this.state.type)) {
        canParseAsKeyword = false;
        rightOfAs = isImport ? this.parseIdentifier() : this.parseModuleExportName();
      } else {
        hasTypeSpecifier = true;
        leftOfAs = firstAs;
      }
    } else if (tokenIsKeywordOrIdentifier(this.state.type)) {
      hasTypeSpecifier = true;
      if (isImport) {
        leftOfAs = this.parseIdentifier(true);
        if (!this.isContextual(93)) {
          this.checkReservedWord(leftOfAs.name, leftOfAs.loc.start, true, true);
        }
      } else {
        leftOfAs = this.parseModuleExportName();
      }
    }
    if (hasTypeSpecifier && isInTypeOnlyImportExport) {
      this.raise(isImport ? TSErrors.TypeModifierIsUsedInTypeImports : TSErrors.TypeModifierIsUsedInTypeExports, loc);
    }
    node[leftOfAsKey] = leftOfAs;
    node[rightOfAsKey] = rightOfAs;
    const kindKey = isImport ? "importKind" : "exportKind";
    node[kindKey] = hasTypeSpecifier ? "type" : "value";
    if (canParseAsKeyword && this.eatContextual(93)) {
      node[rightOfAsKey] = isImport ? this.parseIdentifier() : this.parseModuleExportName();
    }
    if (!node[rightOfAsKey]) {
      node[rightOfAsKey] = this.cloneIdentifier(node[leftOfAsKey]);
    }
    if (isImport) {
      this.checkIdentifier(node[rightOfAsKey], hasTypeSpecifier ? 4098 : 4096);
    }
  }
  fillOptionalPropertiesForTSESLint(node) {
    var _node$directive, _node$decorators, _node$optional, _node$typeAnnotation, _node$accessibility, _node$decorators2, _node$override, _node$readonly, _node$static, _node$declare, _node$returnType, _node$typeParameters, _node$optional2, _node$optional3, _node$accessibility2, _node$readonly2, _node$static2, _node$declare2, _node$definite, _node$readonly3, _node$typeAnnotation2, _node$accessibility3, _node$decorators3, _node$override2, _node$optional4, _node$id, _node$abstract, _node$declare3, _node$decorators4, _node$implements, _node$superTypeArgume, _node$typeParameters2, _node$declare4, _node$definite2, _node$const, _node$declare5, _node$computed, _node$qualifier, _node$options, _node$declare6, _node$extends, _node$optional5, _node$readonly4, _node$declare7, _node$global, _node$const2, _node$in, _node$out;
    switch (node.type) {
      case "ExpressionStatement":
        (_node$directive = node.directive) != null ? _node$directive : node.directive = undefined;
        return;
      case "RestElement":
        node.value = undefined;
      case "Identifier":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "ObjectPattern":
        (_node$decorators = node.decorators) != null ? _node$decorators : node.decorators = [];
        (_node$optional = node.optional) != null ? _node$optional : node.optional = false;
        (_node$typeAnnotation = node.typeAnnotation) != null ? _node$typeAnnotation : node.typeAnnotation = undefined;
        return;
      case "TSParameterProperty":
        (_node$accessibility = node.accessibility) != null ? _node$accessibility : node.accessibility = undefined;
        (_node$decorators2 = node.decorators) != null ? _node$decorators2 : node.decorators = [];
        (_node$override = node.override) != null ? _node$override : node.override = false;
        (_node$readonly = node.readonly) != null ? _node$readonly : node.readonly = false;
        (_node$static = node.static) != null ? _node$static : node.static = false;
        return;
      case "TSEmptyBodyFunctionExpression":
        node.body = null;
      case "TSDeclareFunction":
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ClassMethod":
      case "ClassPrivateMethod":
        (_node$declare = node.declare) != null ? _node$declare : node.declare = false;
        (_node$returnType = node.returnType) != null ? _node$returnType : node.returnType = undefined;
        (_node$typeParameters = node.typeParameters) != null ? _node$typeParameters : node.typeParameters = undefined;
        return;
      case "Property":
        (_node$optional2 = node.optional) != null ? _node$optional2 : node.optional = false;
        return;
      case "TSMethodSignature":
      case "TSPropertySignature":
        (_node$optional3 = node.optional) != null ? _node$optional3 : node.optional = false;
      case "TSIndexSignature":
        (_node$accessibility2 = node.accessibility) != null ? _node$accessibility2 : node.accessibility = undefined;
        (_node$readonly2 = node.readonly) != null ? _node$readonly2 : node.readonly = false;
        (_node$static2 = node.static) != null ? _node$static2 : node.static = false;
        return;
      case "TSAbstractPropertyDefinition":
      case "PropertyDefinition":
      case "TSAbstractAccessorProperty":
      case "AccessorProperty":
        (_node$declare2 = node.declare) != null ? _node$declare2 : node.declare = false;
        (_node$definite = node.definite) != null ? _node$definite : node.definite = false;
        (_node$readonly3 = node.readonly) != null ? _node$readonly3 : node.readonly = false;
        (_node$typeAnnotation2 = node.typeAnnotation) != null ? _node$typeAnnotation2 : node.typeAnnotation = undefined;
      case "TSAbstractMethodDefinition":
      case "MethodDefinition":
        (_node$accessibility3 = node.accessibility) != null ? _node$accessibility3 : node.accessibility = undefined;
        (_node$decorators3 = node.decorators) != null ? _node$decorators3 : node.decorators = [];
        (_node$override2 = node.override) != null ? _node$override2 : node.override = false;
        (_node$optional4 = node.optional) != null ? _node$optional4 : node.optional = false;
        return;
      case "ClassExpression":
        (_node$id = node.id) != null ? _node$id : node.id = null;
      case "ClassDeclaration":
        (_node$abstract = node.abstract) != null ? _node$abstract : node.abstract = false;
        (_node$declare3 = node.declare) != null ? _node$declare3 : node.declare = false;
        (_node$decorators4 = node.decorators) != null ? _node$decorators4 : node.decorators = [];
        (_node$implements = node.implements) != null ? _node$implements : node.implements = [];
        (_node$superTypeArgume = node.superTypeArguments) != null ? _node$superTypeArgume : node.superTypeArguments = undefined;
        (_node$typeParameters2 = node.typeParameters) != null ? _node$typeParameters2 : node.typeParameters = undefined;
        return;
      case "TSTypeAliasDeclaration":
      case "VariableDeclaration":
        (_node$declare4 = node.declare) != null ? _node$declare4 : node.declare = false;
        return;
      case "VariableDeclarator":
        (_node$definite2 = node.definite) != null ? _node$definite2 : node.definite = false;
        return;
      case "TSEnumDeclaration":
        (_node$const = node.const) != null ? _node$const : node.const = false;
        (_node$declare5 = node.declare) != null ? _node$declare5 : node.declare = false;
        return;
      case "TSEnumMember":
        (_node$computed = node.computed) != null ? _node$computed : node.computed = false;
        return;
      case "TSImportType":
        (_node$qualifier = node.qualifier) != null ? _node$qualifier : node.qualifier = null;
        (_node$options = node.options) != null ? _node$options : node.options = null;
        return;
      case "TSInterfaceDeclaration":
        (_node$declare6 = node.declare) != null ? _node$declare6 : node.declare = false;
        (_node$extends = node.extends) != null ? _node$extends : node.extends = [];
        return;
      case "TSMappedType":
        (_node$optional5 = node.optional) != null ? _node$optional5 : node.optional = false;
        (_node$readonly4 = node.readonly) != null ? _node$readonly4 : node.readonly = undefined;
        return;
      case "TSModuleDeclaration":
        (_node$declare7 = node.declare) != null ? _node$declare7 : node.declare = false;
        (_node$global = node.global) != null ? _node$global : node.global = node.kind === "global";
        return;
      case "TSTypeParameter":
        (_node$const2 = node.const) != null ? _node$const2 : node.const = false;
        (_node$in = node.in) != null ? _node$in : node.in = false;
        (_node$out = node.out) != null ? _node$out : node.out = false;
        return;
    }
  }
  chStartsBindingIdentifierAndNotRelationalOperator(ch, pos) {
    if (isIdentifierStart(ch)) {
      keywordAndTSRelationalOperator.lastIndex = pos;
      if (keywordAndTSRelationalOperator.test(this.input)) {
        const endCh = this.codePointAtPos(keywordAndTSRelationalOperator.lastIndex);
        if (!isIdentifierChar(endCh) && endCh !== 92) {
          return false;
        }
      }
      return true;
    } else if (ch === 92) {
      return true;
    } else {
      return false;
    }
  }
  nextTokenIsIdentifierAndNotTSRelationalOperatorOnSameLine() {
    const next = this.nextTokenInLineStart();
    const nextCh = this.codePointAtPos(next);
    return this.chStartsBindingIdentifierAndNotRelationalOperator(nextCh, next);
  }
  nextTokenIsIdentifierOrStringLiteralOnSameLine() {
    const next = this.nextTokenInLineStart();
    const nextCh = this.codePointAtPos(next);
    return this.chStartsBindingIdentifier(nextCh, next) || nextCh === 34 || nextCh === 39;
  }
};
function isPossiblyLiteralEnum(expression) {
  if (expression.type !== "MemberExpression") return false;
  const {
    computed,
    property
  } = expression;
  if (computed && property.type !== "StringLiteral" && (property.type !== "TemplateLiteral" || property.expressions.length > 0)) {
    return false;
  }
  return isUncomputedMemberExpressionChain(expression.object);
}
function isValidAmbientConstInitializer(expression, estree) {
  var _expression$extra;
  const {
    type
  } = expression;
  if ((_expression$extra = expression.extra) != null && _expression$extra.parenthesized) {
    return false;
  }
  if (estree) {
    if (type === "Literal") {
      const {
        value
      } = expression;
      if (typeof value === "string" || typeof value === "boolean") {
        return true;
      }
    }
  } else {
    if (type === "StringLiteral" || type === "BooleanLiteral") {
      return true;
    }
  }
  if (isNumber(expression, estree) || isNegativeNumber(expression, estree)) {
    return true;
  }
  if (type === "TemplateLiteral" && expression.expressions.length === 0) {
    return true;
  }
  if (isPossiblyLiteralEnum(expression)) {
    return true;
  }
  return false;
}
function isNumber(expression, estree) {
  if (estree) {
    return expression.type === "Literal" && (typeof expression.value === "number" || "bigint" in expression);
  }
  return expression.type === "NumericLiteral" || expression.type === "BigIntLiteral";
}
function isNegativeNumber(expression, estree) {
  if (expression.type === "UnaryExpression") {
    const {
      operator,
      argument
    } = expression;
    if (operator === "-" && isNumber(argument, estree)) {
      return true;
    }
  }
  return false;
}
function isUncomputedMemberExpressionChain(expression) {
  if (expression.type === "Identifier") return true;
  if (expression.type !== "MemberExpression" || expression.computed) {
    return false;
  }
  return isUncomputedMemberExpressionChain(expression.object);
}
const PlaceholderErrors = ParseErrorEnum`placeholders`({
  ClassNameIsRequired: "A class name is required.",
  UnexpectedSpace: "Unexpected space in placeholder."
});
var placeholders = superClass => class PlaceholdersParserMixin extends superClass {
  parsePlaceholder(expectedNode) {
    if (this.match(133)) {
      const node = this.startNode();
      this.next();
      this.assertNoSpace();
      node.name = super.parseIdentifier(true);
      this.assertNoSpace();
      this.expect(133);
      return this.finishPlaceholder(node, expectedNode);
    }
  }
  finishPlaceholder(node, expectedNode) {
    let placeholder = node;
    if (!placeholder.expectedNode || !placeholder.type) {
      placeholder = this.finishNode(placeholder, "Placeholder");
    }
    placeholder.expectedNode = expectedNode;
    return placeholder;
  }
  getTokenFromCode(code) {
    if (code === 37 && this.input.charCodeAt(this.state.pos + 1) === 37) {
      this.finishOp(133, 2);
    } else {
      super.getTokenFromCode(code);
    }
  }
  parseExprAtom(refExpressionErrors) {
    return this.parsePlaceholder("Expression") || super.parseExprAtom(refExpressionErrors);
  }
  parseIdentifier(liberal) {
    return this.parsePlaceholder("Identifier") || super.parseIdentifier(liberal);
  }
  checkReservedWord(word, startLoc, checkKeywords, isBinding) {
    if (word !== undefined) {
      super.checkReservedWord(word, startLoc, checkKeywords, isBinding);
    }
  }
  cloneIdentifier(node) {
    const cloned = super.cloneIdentifier(node);
    if (cloned.type === "Placeholder") {
      cloned.expectedNode = node.expectedNode;
    }
    return cloned;
  }
  cloneStringLiteral(node) {
    if (node.type === "Placeholder") {
      return this.cloneIdentifier(node);
    }
    return super.cloneStringLiteral(node);
  }
  parseBindingAtom() {
    return this.parsePlaceholder("Pattern") || super.parseBindingAtom();
  }
  isValidLVal(type, disallowCallExpression, isParenthesized, binding) {
    return type === "Placeholder" || super.isValidLVal(type, disallowCallExpression, isParenthesized, binding);
  }
  toAssignable(node, isLHS) {
    if (node && node.type === "Placeholder" && node.expectedNode === "Expression") {
      node.expectedNode = "Pattern";
    } else {
      super.toAssignable(node, isLHS);
    }
  }
  chStartsBindingIdentifier(ch, pos) {
    if (super.chStartsBindingIdentifier(ch, pos)) {
      return true;
    }
    const next = this.nextTokenStart();
    if (this.input.charCodeAt(next) === 37 && this.input.charCodeAt(next + 1) === 37) {
      return true;
    }
    return false;
  }
  verifyBreakContinue(node, isBreak) {
    var _node$label;
    if (((_node$label = node.label) == null ? void 0 : _node$label.type) === "Placeholder") return;
    super.verifyBreakContinue(node, isBreak);
  }
  parseExpressionStatement(node, expr) {
    var _expr$extra;
    if (expr.type !== "Placeholder" || (_expr$extra = expr.extra) != null && _expr$extra.parenthesized) {
      return super.parseExpressionStatement(node, expr);
    }
    if (this.match(14)) {
      const stmt = node;
      stmt.label = this.finishPlaceholder(expr, "Identifier");
      this.next();
      stmt.body = super.parseStatementOrSloppyAnnexBFunctionDeclaration();
      return this.finishNode(stmt, "LabeledStatement");
    }
    this.semicolon();
    const stmtPlaceholder = node;
    stmtPlaceholder.name = expr.name;
    return this.finishPlaceholder(stmtPlaceholder, "Statement");
  }
  parseBlock(allowDirectives, createNewLexicalScope, afterBlockParse) {
    return this.parsePlaceholder("BlockStatement") || super.parseBlock(allowDirectives, createNewLexicalScope, afterBlockParse);
  }
  parseFunctionId(requireId) {
    return this.parsePlaceholder("Identifier") || super.parseFunctionId(requireId);
  }
  parseClass(node, isStatement, optionalId) {
    const type = isStatement ? "ClassDeclaration" : "ClassExpression";
    this.next();
    const oldStrict = this.state.strict;
    const placeholder = this.parsePlaceholder("Identifier");
    if (placeholder) {
      if (this.match(81) || this.match(133) || this.match(5)) {
        node.id = placeholder;
      } else if (optionalId || !isStatement) {
        node.id = null;
        node.body = this.finishPlaceholder(placeholder, "ClassBody");
        return this.finishNode(node, type);
      } else {
        throw this.raise(PlaceholderErrors.ClassNameIsRequired, this.state.startLoc);
      }
    } else {
      this.parseClassId(node, isStatement, optionalId);
    }
    super.parseClassSuper(node);
    node.body = this.parsePlaceholder("ClassBody") || super.parseClassBody(!!node.superClass, oldStrict);
    return this.finishNode(node, type);
  }
  parseExport(node, decorators) {
    const placeholder = this.parsePlaceholder("Identifier");
    if (!placeholder) return super.parseExport(node, decorators);
    const node2 = node;
    if (!this.isContextual(98) && !this.match(12)) {
      node2.specifiers = [];
      node2.source = null;
      node2.declaration = this.finishPlaceholder(placeholder, "Declaration");
      return this.finishNode(node2, "ExportNamedDeclaration");
    }
    this.expectPlugin("exportDefaultFrom");
    const specifier = this.startNode();
    specifier.exported = placeholder;
    node2.specifiers = [this.finishNode(specifier, "ExportDefaultSpecifier")];
    return super.parseExport(node2, decorators);
  }
  isExportDefaultSpecifier() {
    if (this.match(65)) {
      const next = this.nextTokenStart();
      if (this.isUnparsedContextual(next, "from")) {
        if (this.input.startsWith(tokenLabelName(133), this.nextTokenStartSince(next + 4))) {
          return true;
        }
      }
    }
    return super.isExportDefaultSpecifier();
  }
  maybeParseExportDefaultSpecifier(node, maybeDefaultIdentifier) {
    var _specifiers;
    if ((_specifiers = node.specifiers) != null && _specifiers.length) {
      return true;
    }
    return super.maybeParseExportDefaultSpecifier(node, maybeDefaultIdentifier);
  }
  checkExport(node) {
    const {
      specifiers
    } = node;
    if (specifiers != null && specifiers.length) {
      node.specifiers = specifiers.filter(node => node.exported.type === "Placeholder");
    }
    super.checkExport(node);
    node.specifiers = specifiers;
  }
  parseImport(node) {
    const placeholder = this.parsePlaceholder("Identifier");
    if (!placeholder) return super.parseImport(node);
    node.specifiers = [];
    if (!this.isContextual(98) && !this.match(12)) {
      node.source = this.finishPlaceholder(placeholder, "StringLiteral");
      this.semicolon();
      return this.finishNode(node, "ImportDeclaration");
    }
    const specifier = this.startNodeAtNode(placeholder);
    specifier.local = placeholder;
    node.specifiers.push(this.finishNode(specifier, "ImportDefaultSpecifier"));
    if (this.eat(12)) {
      const hasStarImport = this.maybeParseStarImportSpecifier(node);
      if (!hasStarImport) this.parseNamedImportSpecifiers(node);
    }
    this.expectContextual(98);
    node.source = this.parseImportSource();
    this.semicolon();
    return this.finishNode(node, "ImportDeclaration");
  }
  parseImportSource() {
    return this.parsePlaceholder("StringLiteral") || super.parseImportSource();
  }
  assertNoSpace() {
    if (this.state.start > this.offsetToSourcePos(this.state.lastTokEndLoc.index)) {
      this.raise(PlaceholderErrors.UnexpectedSpace, this.state.lastTokEndLoc);
    }
  }
};
var v8intrinsic = superClass => class V8IntrinsicMixin extends superClass {
  parseV8Intrinsic() {
    if (this.match(54)) {
      const v8IntrinsicStartLoc = this.state.startLoc;
      const node = this.startNode();
      this.next();
      if (tokenIsIdentifier(this.state.type)) {
        const name = this.parseIdentifierName();
        const identifier = this.createIdentifier(node, name);
        this.castNodeTo(identifier, "V8IntrinsicIdentifier");
        if (this.match(10)) {
          return identifier;
        }
      }
      this.unexpected(v8IntrinsicStartLoc);
    }
  }
  parseExprAtom(refExpressionErrors) {
    return this.parseV8Intrinsic() || super.parseExprAtom(refExpressionErrors);
  }
};
const PIPELINE_PROPOSALS = ["minimal", "fsharp", "hack", "smart"];
const TOPIC_TOKENS = ["^^", "@@", "^", "%", "#"];
function validatePlugins(pluginsMap) {
  if (pluginsMap.has("decorators")) {
    if (pluginsMap.has("decorators-legacy")) {
      throw new Error("Cannot use the decorators and decorators-legacy plugin together");
    }
    const decoratorsBeforeExport = pluginsMap.get("decorators").decoratorsBeforeExport;
    if (decoratorsBeforeExport != null && typeof decoratorsBeforeExport !== "boolean") {
      throw new Error("'decoratorsBeforeExport' must be a boolean, if specified.");
    }
    const allowCallParenthesized = pluginsMap.get("decorators").allowCallParenthesized;
    if (allowCallParenthesized != null && typeof allowCallParenthesized !== "boolean") {
      throw new Error("'allowCallParenthesized' must be a boolean.");
    }
  }
  if (pluginsMap.has("flow") && pluginsMap.has("typescript")) {
    throw new Error("Cannot combine flow and typescript plugins.");
  }
  if (pluginsMap.has("placeholders") && pluginsMap.has("v8intrinsic")) {
    throw new Error("Cannot combine placeholders and v8intrinsic plugins.");
  }
  if (pluginsMap.has("pipelineOperator")) {
    var _pluginsMap$get2;
    const proposal = pluginsMap.get("pipelineOperator").proposal;
    if (!PIPELINE_PROPOSALS.includes(proposal)) {
      const proposalList = PIPELINE_PROPOSALS.map(p => `"${p}"`).join(", ");
      throw new Error(`"pipelineOperator" requires "proposal" option whose value must be one of: ${proposalList}.`);
    }
    if (proposal === "hack") {
      var _pluginsMap$get;
      if (pluginsMap.has("placeholders")) {
        throw new Error("Cannot combine placeholders plugin and Hack-style pipes.");
      }
      if (pluginsMap.has("v8intrinsic")) {
        throw new Error("Cannot combine v8intrinsic plugin and Hack-style pipes.");
      }
      const topicToken = pluginsMap.get("pipelineOperator").topicToken;
      if (!TOPIC_TOKENS.includes(topicToken)) {
        const tokenList = TOPIC_TOKENS.map(t => `"${t}"`).join(", ");
        throw new Error(`"pipelineOperator" in "proposal": "hack" mode also requires a "topicToken" option whose value must be one of: ${tokenList}.`);
      }
      if (topicToken === "#" && ((_pluginsMap$get = pluginsMap.get("recordAndTuple")) == null ? void 0 : _pluginsMap$get.syntaxType) === "hash") {
        throw new Error(`Plugin conflict between \`["pipelineOperator", { proposal: "hack", topicToken: "#" }]\` and \`${JSON.stringify(["recordAndTuple", pluginsMap.get("recordAndTuple")])}\`.`);
      }
    } else if (proposal === "smart" && ((_pluginsMap$get2 = pluginsMap.get("recordAndTuple")) == null ? void 0 : _pluginsMap$get2.syntaxType) === "hash") {
      throw new Error(`Plugin conflict between \`["pipelineOperator", { proposal: "smart" }]\` and \`${JSON.stringify(["recordAndTuple", pluginsMap.get("recordAndTuple")])}\`.`);
    }
  }
  if (pluginsMap.has("moduleAttributes")) {
    if (pluginsMap.has("deprecatedImportAssert") || pluginsMap.has("importAssertions")) {
      throw new Error("Cannot combine importAssertions, deprecatedImportAssert and moduleAttributes plugins.");
    }
    const moduleAttributesVersionPluginOption = pluginsMap.get("moduleAttributes").version;
    if (moduleAttributesVersionPluginOption !== "may-2020") {
      throw new Error("The 'moduleAttributes' plugin requires a 'version' option," + " representing the last proposal update. Currently, the" + " only supported value is 'may-2020'.");
    }
  }
  if (pluginsMap.has("importAssertions")) {
    if (pluginsMap.has("deprecatedImportAssert")) {
      throw new Error("Cannot combine importAssertions and deprecatedImportAssert plugins.");
    }
  }
  if (pluginsMap.has("deprecatedImportAssert")) ;else if (pluginsMap.has("importAttributes") && pluginsMap.get("importAttributes").deprecatedAssertSyntax) {
    pluginsMap.set("deprecatedImportAssert", {});
  }
  if (pluginsMap.has("recordAndTuple")) {
    const syntaxType = pluginsMap.get("recordAndTuple").syntaxType;
    if (syntaxType != null) {
      const RECORD_AND_TUPLE_SYNTAX_TYPES = ["hash", "bar"];
      if (!RECORD_AND_TUPLE_SYNTAX_TYPES.includes(syntaxType)) {
        throw new Error("The 'syntaxType' option of the 'recordAndTuple' plugin must be one of: " + RECORD_AND_TUPLE_SYNTAX_TYPES.map(p => `'${p}'`).join(", "));
      }
    }
  }
  if (pluginsMap.has("asyncDoExpressions") && !pluginsMap.has("doExpressions")) {
    const error = new Error("'asyncDoExpressions' requires 'doExpressions', please add 'doExpressions' to parser plugins.");
    error.missingPlugins = "doExpressions";
    throw error;
  }
  if (pluginsMap.has("optionalChainingAssign") && pluginsMap.get("optionalChainingAssign").version !== "2023-07") {
    throw new Error("The 'optionalChainingAssign' plugin requires a 'version' option," + " representing the last proposal update. Currently, the" + " only supported value is '2023-07'.");
  }
  if (pluginsMap.has("discardBinding") && pluginsMap.get("discardBinding").syntaxType !== "void") {
    throw new Error("The 'discardBinding' plugin requires a 'syntaxType' option. Currently the only supported value is 'void'.");
  }
}
const mixinPlugins = {
  estree,
  jsx,
  flow,
  typescript,
  v8intrinsic,
  placeholders
};
const mixinPluginNames = Object.keys(mixinPlugins);
class ExpressionParser extends LValParser {
  checkProto(prop, isRecord, sawProto, refExpressionErrors) {
    if (prop.type === "SpreadElement" || this.isObjectMethod(prop) || prop.computed || prop.shorthand) {
      return sawProto;
    }
    const key = prop.key;
    const name = key.type === "Identifier" ? key.name : key.value;
    if (name === "__proto__") {
      if (isRecord) {
        this.raise(Errors.RecordNoProto, key);
        return true;
      }
      if (sawProto) {
        if (refExpressionErrors) {
          if (refExpressionErrors.doubleProtoLoc === null) {
            refExpressionErrors.doubleProtoLoc = key.loc.start;
          }
        } else {
          this.raise(Errors.DuplicateProto, key);
        }
      }
      return true;
    }
    return sawProto;
  }
  shouldExitDescending(expr, potentialArrowAt) {
    return expr.type === "ArrowFunctionExpression" && this.offsetToSourcePos(expr.start) === potentialArrowAt;
  }
  getExpression() {
    this.enterInitialScopes();
    this.nextToken();
    if (this.match(140)) {
      throw this.raise(Errors.ParseExpressionEmptyInput, this.state.startLoc);
    }
    const expr = this.parseExpression();
    if (!this.match(140)) {
      throw this.raise(Errors.ParseExpressionExpectsEOF, this.state.startLoc, {
        unexpected: this.input.codePointAt(this.state.start)
      });
    }
    this.finalizeRemainingComments();
    expr.comments = this.comments;
    expr.errors = this.state.errors;
    if (this.optionFlags & 256) {
      expr.tokens = this.tokens;
    }
    return expr;
  }
  parseExpression(disallowIn, refExpressionErrors) {
    if (disallowIn) {
      return this.disallowInAnd(() => this.parseExpressionBase(refExpressionErrors));
    }
    return this.allowInAnd(() => this.parseExpressionBase(refExpressionErrors));
  }
  parseExpressionBase(refExpressionErrors) {
    const startLoc = this.state.startLoc;
    const expr = this.parseMaybeAssign(refExpressionErrors);
    if (this.match(12)) {
      const node = this.startNodeAt(startLoc);
      node.expressions = [expr];
      while (this.eat(12)) {
        node.expressions.push(this.parseMaybeAssign(refExpressionErrors));
      }
      this.toReferencedList(node.expressions);
      return this.finishNode(node, "SequenceExpression");
    }
    return expr;
  }
  parseMaybeAssignDisallowIn(refExpressionErrors, afterLeftParse) {
    return this.disallowInAnd(() => this.parseMaybeAssign(refExpressionErrors, afterLeftParse));
  }
  parseMaybeAssignAllowIn(refExpressionErrors, afterLeftParse) {
    return this.allowInAnd(() => this.parseMaybeAssign(refExpressionErrors, afterLeftParse));
  }
  setOptionalParametersError(refExpressionErrors) {
    refExpressionErrors.optionalParametersLoc = this.state.startLoc;
  }
  parseMaybeAssign(refExpressionErrors, afterLeftParse) {
    const startLoc = this.state.startLoc;
    const isYield = this.isContextual(108);
    if (isYield) {
      if (this.prodParam.hasYield) {
        this.next();
        let left = this.parseYield(startLoc);
        if (afterLeftParse) {
          left = afterLeftParse.call(this, left, startLoc);
        }
        return left;
      }
    }
    let ownExpressionErrors;
    if (refExpressionErrors) {
      ownExpressionErrors = false;
    } else {
      refExpressionErrors = new ExpressionErrors();
      ownExpressionErrors = true;
    }
    const {
      type
    } = this.state;
    if (type === 10 || tokenIsIdentifier(type)) {
      this.state.potentialArrowAt = this.state.start;
    }
    let left = this.parseMaybeConditional(refExpressionErrors);
    if (afterLeftParse) {
      left = afterLeftParse.call(this, left, startLoc);
    }
    if (tokenIsAssignment(this.state.type)) {
      const node = this.startNodeAt(startLoc);
      const operator = this.state.value;
      node.operator = operator;
      if (this.match(29)) {
        this.toAssignable(left, true);
        node.left = left;
        const startIndex = startLoc.index;
        if (refExpressionErrors.doubleProtoLoc != null && refExpressionErrors.doubleProtoLoc.index >= startIndex) {
          refExpressionErrors.doubleProtoLoc = null;
        }
        if (refExpressionErrors.shorthandAssignLoc != null && refExpressionErrors.shorthandAssignLoc.index >= startIndex) {
          refExpressionErrors.shorthandAssignLoc = null;
        }
        if (refExpressionErrors.privateKeyLoc != null && refExpressionErrors.privateKeyLoc.index >= startIndex) {
          this.checkDestructuringPrivate(refExpressionErrors);
          refExpressionErrors.privateKeyLoc = null;
        }
        if (refExpressionErrors.voidPatternLoc != null && refExpressionErrors.voidPatternLoc.index >= startIndex) {
          refExpressionErrors.voidPatternLoc = null;
        }
      } else {
        node.left = left;
      }
      this.next();
      node.right = this.parseMaybeAssign();
      this.checkLVal(left, this.finishNode(node, "AssignmentExpression"), undefined, undefined, undefined, undefined, operator === "||=" || operator === "&&=" || operator === "??=");
      return node;
    } else if (ownExpressionErrors) {
      this.checkExpressionErrors(refExpressionErrors, true);
    }
    if (isYield) {
      const {
        type
      } = this.state;
      const startsExpr = this.hasPlugin("v8intrinsic") ? tokenCanStartExpression(type) : tokenCanStartExpression(type) && !this.match(54);
      if (startsExpr && !this.isAmbiguousPrefixOrIdentifier()) {
        this.raiseOverwrite(Errors.YieldNotInGeneratorFunction, startLoc);
        return this.parseYield(startLoc);
      }
    }
    return left;
  }
  parseMaybeConditional(refExpressionErrors) {
    const startLoc = this.state.startLoc;
    const potentialArrowAt = this.state.potentialArrowAt;
    const expr = this.parseExprOps(refExpressionErrors);
    if (this.shouldExitDescending(expr, potentialArrowAt)) {
      return expr;
    }
    return this.parseConditional(expr, startLoc, refExpressionErrors);
  }
  parseConditional(expr, startLoc, refExpressionErrors) {
    if (this.eat(17)) {
      const node = this.startNodeAt(startLoc);
      node.test = expr;
      node.consequent = this.parseMaybeAssignAllowIn();
      this.expect(14);
      node.alternate = this.parseMaybeAssign();
      return this.finishNode(node, "ConditionalExpression");
    }
    return expr;
  }
  parseMaybeUnaryOrPrivate(refExpressionErrors) {
    return this.match(139) ? this.parsePrivateName() : this.parseMaybeUnary(refExpressionErrors);
  }
  parseExprOps(refExpressionErrors) {
    const startLoc = this.state.startLoc;
    const potentialArrowAt = this.state.potentialArrowAt;
    const expr = this.parseMaybeUnaryOrPrivate(refExpressionErrors);
    if (this.shouldExitDescending(expr, potentialArrowAt)) {
      return expr;
    }
    return this.parseExprOp(expr, startLoc, -1);
  }
  parseExprOp(left, leftStartLoc, minPrec) {
    if (this.isPrivateName(left)) {
      const value = this.getPrivateNameSV(left);
      if (minPrec >= tokenOperatorPrecedence(58) || !this.prodParam.hasIn || !this.match(58)) {
        this.raise(Errors.PrivateInExpectedIn, left, {
          identifierName: value
        });
      }
      this.classScope.usePrivateName(value, left.loc.start);
    }
    const op = this.state.type;
    if (tokenIsOperator(op) && (this.prodParam.hasIn || !this.match(58))) {
      let prec = tokenOperatorPrecedence(op);
      if (prec > minPrec) {
        if (op === 39) {
          this.expectPlugin("pipelineOperator");
          if (this.state.inFSharpPipelineDirectBody) {
            return left;
          }
          this.checkPipelineAtInfixOperator(left, leftStartLoc);
        }
        const node = this.startNodeAt(leftStartLoc);
        node.left = left;
        node.operator = this.state.value;
        const logical = op === 41 || op === 42;
        const coalesce = op === 40;
        if (coalesce) {
          prec = tokenOperatorPrecedence(42);
        }
        this.next();
        if (op === 39 && this.hasPlugin(["pipelineOperator", {
          proposal: "minimal"
        }])) {
          if (this.state.type === 96 && this.prodParam.hasAwait) {
            throw this.raise(Errors.UnexpectedAwaitAfterPipelineBody, this.state.startLoc);
          }
        }
        node.right = this.parseExprOpRightExpr(op, prec);
        const finishedNode = this.finishNode(node, logical || coalesce ? "LogicalExpression" : "BinaryExpression");
        const nextOp = this.state.type;
        if (coalesce && (nextOp === 41 || nextOp === 42) || logical && nextOp === 40) {
          throw this.raise(Errors.MixingCoalesceWithLogical, this.state.startLoc);
        }
        return this.parseExprOp(finishedNode, leftStartLoc, minPrec);
      }
    }
    return left;
  }
  parseExprOpRightExpr(op, prec) {
    const startLoc = this.state.startLoc;
    switch (op) {
      case 39:
        switch (this.getPluginOption("pipelineOperator", "proposal")) {
          case "hack":
            return this.withTopicBindingContext(() => {
              return this.parseHackPipeBody();
            });
          case "fsharp":
            return this.withSoloAwaitPermittingContext(() => {
              return this.parseFSharpPipelineBody(prec);
            });
        }
        if (this.getPluginOption("pipelineOperator", "proposal") === "smart") {
          return this.withTopicBindingContext(() => {
            if (this.prodParam.hasYield && this.isContextual(108)) {
              throw this.raise(Errors.PipeBodyIsTighter, this.state.startLoc);
            }
            return this.parseSmartPipelineBodyInStyle(this.parseExprOpBaseRightExpr(op, prec), startLoc);
          });
        }
      default:
        return this.parseExprOpBaseRightExpr(op, prec);
    }
  }
  parseExprOpBaseRightExpr(op, prec) {
    const startLoc = this.state.startLoc;
    return this.parseExprOp(this.parseMaybeUnaryOrPrivate(), startLoc, tokenIsRightAssociative(op) ? prec - 1 : prec);
  }
  parseHackPipeBody() {
    var _body$extra;
    const {
      startLoc
    } = this.state;
    const body = this.parseMaybeAssign();
    const requiredParentheses = UnparenthesizedPipeBodyDescriptions.has(body.type);
    if (requiredParentheses && !((_body$extra = body.extra) != null && _body$extra.parenthesized)) {
      this.raise(Errors.PipeUnparenthesizedBody, startLoc, {
        type: body.type
      });
    }
    if (!this.topicReferenceWasUsedInCurrentContext()) {
      this.raise(Errors.PipeTopicUnused, startLoc);
    }
    return body;
  }
  checkExponentialAfterUnary(node) {
    if (this.match(57)) {
      this.raise(Errors.UnexpectedTokenUnaryExponentiation, node.argument);
    }
  }
  parseMaybeUnary(refExpressionErrors, sawUnary) {
    const startLoc = this.state.startLoc;
    const isAwait = this.isContextual(96);
    if (isAwait && this.recordAwaitIfAllowed()) {
      this.next();
      const expr = this.parseAwait(startLoc);
      if (!sawUnary) this.checkExponentialAfterUnary(expr);
      return expr;
    }
    const update = this.match(34);
    const node = this.startNode();
    if (tokenIsPrefix(this.state.type)) {
      node.operator = this.state.value;
      node.prefix = true;
      if (this.match(72)) {
        this.expectPlugin("throwExpressions");
      }
      const isDelete = this.match(89);
      this.next();
      node.argument = this.parseMaybeUnary(null, true);
      this.checkExpressionErrors(refExpressionErrors, true);
      if (this.state.strict && isDelete) {
        const arg = node.argument;
        if (arg.type === "Identifier") {
          this.raise(Errors.StrictDelete, node);
        } else if (this.hasPropertyAsPrivateName(arg)) {
          this.raise(Errors.DeletePrivateField, node);
        }
      }
      if (!update) {
        if (!sawUnary) {
          this.checkExponentialAfterUnary(node);
        }
        return this.finishNode(node, "UnaryExpression");
      }
    }
    const expr = this.parseUpdate(node, update, refExpressionErrors);
    if (isAwait) {
      const {
        type
      } = this.state;
      const startsExpr = this.hasPlugin("v8intrinsic") ? tokenCanStartExpression(type) : tokenCanStartExpression(type) && !this.match(54);
      if (startsExpr && !this.isAmbiguousPrefixOrIdentifier()) {
        this.raiseOverwrite(Errors.AwaitNotInAsyncContext, startLoc);
        return this.parseAwait(startLoc);
      }
    }
    return expr;
  }
  parseUpdate(node, update, refExpressionErrors) {
    if (update) {
      const updateExpressionNode = node;
      this.checkLVal(updateExpressionNode.argument, this.finishNode(updateExpressionNode, "UpdateExpression"));
      return node;
    }
    const startLoc = this.state.startLoc;
    let expr = this.parseExprSubscripts(refExpressionErrors);
    if (this.checkExpressionErrors(refExpressionErrors, false)) return expr;
    while (tokenIsPostfix(this.state.type) && !this.canInsertSemicolon()) {
      const node = this.startNodeAt(startLoc);
      node.operator = this.state.value;
      node.prefix = false;
      node.argument = expr;
      this.next();
      this.checkLVal(expr, expr = this.finishNode(node, "UpdateExpression"));
    }
    return expr;
  }
  parseExprSubscripts(refExpressionErrors) {
    const startLoc = this.state.startLoc;
    const potentialArrowAt = this.state.potentialArrowAt;
    const expr = this.parseExprAtom(refExpressionErrors);
    if (this.shouldExitDescending(expr, potentialArrowAt)) {
      return expr;
    }
    return this.parseSubscripts(expr, startLoc);
  }
  parseSubscripts(base, startLoc, noCalls) {
    const state = {
      optionalChainMember: false,
      maybeAsyncArrow: this.atPossibleAsyncArrow(base),
      stop: false
    };
    do {
      base = this.parseSubscript(base, startLoc, noCalls, state);
      state.maybeAsyncArrow = false;
    } while (!state.stop);
    return base;
  }
  parseSubscript(base, startLoc, noCalls, state) {
    const {
      type
    } = this.state;
    if (!noCalls && type === 15) {
      return this.parseBind(base, startLoc, state);
    } else if (tokenIsTemplate(type)) {
      return this.parseTaggedTemplateExpression(base, startLoc, state);
    }
    let optional = false;
    if (type === 18) {
      if (noCalls) {
        this.raise(Errors.OptionalChainingNoNew, this.state.startLoc);
        if (this.lookaheadCharCode() === 40) {
          return this.stopParseSubscript(base, state);
        }
      }
      state.optionalChainMember = optional = true;
      this.next();
    }
    if (!noCalls && this.match(10)) {
      return this.parseCoverCallAndAsyncArrowHead(base, startLoc, state, optional);
    } else {
      const computed = this.eat(0);
      if (computed || optional || this.eat(16)) {
        return this.parseMember(base, startLoc, state, computed, optional);
      } else {
        return this.stopParseSubscript(base, state);
      }
    }
  }
  stopParseSubscript(base, state) {
    state.stop = true;
    return base;
  }
  parseMember(base, startLoc, state, computed, optional) {
    const node = this.startNodeAt(startLoc);
    node.object = base;
    node.computed = computed;
    if (computed) {
      node.property = this.parseExpression();
      this.expect(3);
    } else if (this.match(139)) {
      if (base.type === "Super") {
        this.raise(Errors.SuperPrivateField, startLoc);
      }
      this.classScope.usePrivateName(this.state.value, this.state.startLoc);
      node.property = this.parsePrivateName();
    } else {
      node.property = this.parseIdentifier(true);
    }
    if (state.optionalChainMember) {
      node.optional = optional;
      return this.finishNode(node, "OptionalMemberExpression");
    } else {
      return this.finishNode(node, "MemberExpression");
    }
  }
  parseBind(base, startLoc, state) {
    const node = this.startNodeAt(startLoc);
    node.object = base;
    this.next();
    const isImport = this.match(83);
    const callee = this.parseNoCallExpr();
    if (callee.type === "Super" || isImport && callee.type === "ImportExpression" || callee.type === "Import") {
      throw this.raise(Errors.UnsupportedBindRHS, callee);
    }
    node.callee = callee;
    state.stop = true;
    return this.parseSubscripts(this.finishNode(node, "BindExpression"), startLoc, false);
  }
  parseCoverCallAndAsyncArrowHead(base, startLoc, state, optional) {
    const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
    let refExpressionErrors = null;
    this.state.maybeInArrowParameters = true;
    this.next();
    const node = this.startNodeAt(startLoc);
    node.callee = base;
    const {
      maybeAsyncArrow,
      optionalChainMember
    } = state;
    if (maybeAsyncArrow) {
      this.expressionScope.enter(newAsyncArrowScope());
      refExpressionErrors = new ExpressionErrors();
    }
    if (optionalChainMember) {
      node.optional = optional;
    }
    if (optional) {
      node.arguments = this.parseCallExpressionArguments();
    } else {
      node.arguments = this.parseCallExpressionArguments(base.type !== "Super", node, refExpressionErrors);
    }
    let finishedNode = this.finishCallExpression(node, optionalChainMember);
    if (maybeAsyncArrow && this.shouldParseAsyncArrow() && !optional) {
      state.stop = true;
      this.checkDestructuringPrivate(refExpressionErrors);
      this.expressionScope.validateAsPattern();
      this.expressionScope.exit();
      finishedNode = this.parseAsyncArrowFromCallExpression(this.startNodeAt(startLoc), finishedNode);
    } else {
      if (maybeAsyncArrow) {
        this.checkExpressionErrors(refExpressionErrors, true);
        this.expressionScope.exit();
      }
      this.toReferencedArguments(finishedNode);
    }
    this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
    return finishedNode;
  }
  toReferencedArguments(node, isParenthesizedExpr) {
    this.toReferencedListDeep(node.arguments, isParenthesizedExpr);
  }
  parseTaggedTemplateExpression(base, startLoc, state) {
    const node = this.startNodeAt(startLoc);
    node.tag = base;
    node.quasi = this.parseTemplate(true);
    if (state.optionalChainMember) {
      this.raise(Errors.OptionalChainingNoTemplate, startLoc);
    }
    return this.finishNode(node, "TaggedTemplateExpression");
  }
  atPossibleAsyncArrow(base) {
    return base.type === "Identifier" && base.name === "async" && this.state.lastTokEndLoc.index === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 && this.offsetToSourcePos(base.start) === this.state.potentialArrowAt;
  }
  finishCallExpression(node, optional) {
    if (node.callee.type === "Import") {
      if (node.arguments.length === 0 || node.arguments.length > 2) {
        this.raise(Errors.ImportCallArity, node);
      } else {
        for (const arg of node.arguments) {
          if (arg.type === "SpreadElement") {
            this.raise(Errors.ImportCallSpreadArgument, arg);
          }
        }
      }
    }
    return this.finishNode(node, optional ? "OptionalCallExpression" : "CallExpression");
  }
  parseCallExpressionArguments(allowPlaceholder, nodeForExtra, refExpressionErrors) {
    const elts = [];
    let first = true;
    const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
    this.state.inFSharpPipelineDirectBody = false;
    while (!this.eat(11)) {
      if (first) {
        first = false;
      } else {
        this.expect(12);
        if (this.match(11)) {
          if (nodeForExtra) {
            this.addTrailingCommaExtraToNode(nodeForExtra);
          }
          this.next();
          break;
        }
      }
      elts.push(this.parseExprListItem(11, false, refExpressionErrors, allowPlaceholder));
    }
    this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
    return elts;
  }
  shouldParseAsyncArrow() {
    return this.match(19) && !this.canInsertSemicolon();
  }
  parseAsyncArrowFromCallExpression(node, call) {
    var _call$extra;
    this.resetPreviousNodeTrailingComments(call);
    this.expect(19);
    this.parseArrowExpression(node, call.arguments, true, (_call$extra = call.extra) == null ? void 0 : _call$extra.trailingCommaLoc);
    if (call.innerComments) {
      setInnerComments(node, call.innerComments);
    }
    if (call.callee.trailingComments) {
      setInnerComments(node, call.callee.trailingComments);
    }
    return node;
  }
  parseNoCallExpr() {
    const startLoc = this.state.startLoc;
    return this.parseSubscripts(this.parseExprAtom(), startLoc, true);
  }
  parseExprAtom(refExpressionErrors) {
    let node;
    let decorators = null;
    const {
      type
    } = this.state;
    switch (type) {
      case 79:
        return this.parseSuper();
      case 83:
        node = this.startNode();
        this.next();
        if (this.match(16)) {
          return this.parseImportMetaPropertyOrPhaseCall(node);
        }
        if (this.match(10)) {
          if (this.optionFlags & 512) {
            return this.parseImportCall(node);
          } else {
            return this.finishNode(node, "Import");
          }
        } else {
          this.raise(Errors.UnsupportedImport, this.state.lastTokStartLoc);
          return this.finishNode(node, "Import");
        }
      case 78:
        node = this.startNode();
        this.next();
        return this.finishNode(node, "ThisExpression");
      case 90:
        {
          return this.parseDo(this.startNode(), false);
        }
      case 56:
      case 31:
        {
          this.readRegexp();
          return this.parseRegExpLiteral(this.state.value);
        }
      case 135:
        return this.parseNumericLiteral(this.state.value);
      case 136:
        return this.parseBigIntLiteral(this.state.value);
      case 134:
        return this.parseStringLiteral(this.state.value);
      case 84:
        return this.parseNullLiteral();
      case 85:
        return this.parseBooleanLiteral(true);
      case 86:
        return this.parseBooleanLiteral(false);
      case 10:
        {
          const canBeArrow = this.state.potentialArrowAt === this.state.start;
          return this.parseParenAndDistinguishExpression(canBeArrow);
        }
      case 0:
        {
          return this.parseArrayLike(3, false, refExpressionErrors);
        }
      case 5:
        {
          return this.parseObjectLike(8, false, false, refExpressionErrors);
        }
      case 68:
        return this.parseFunctionOrFunctionSent();
      case 26:
        decorators = this.parseDecorators();
      case 80:
        return this.parseClass(this.maybeTakeDecorators(decorators, this.startNode()), false);
      case 77:
        return this.parseNewOrNewTarget();
      case 25:
      case 24:
        return this.parseTemplate(false);
      case 15:
        {
          node = this.startNode();
          this.next();
          node.object = null;
          const callee = node.callee = this.parseNoCallExpr();
          if (callee.type === "MemberExpression") {
            return this.finishNode(node, "BindExpression");
          } else {
            throw this.raise(Errors.UnsupportedBind, callee);
          }
        }
      case 139:
        {
          this.raise(Errors.PrivateInExpectedIn, this.state.startLoc, {
            identifierName: this.state.value
          });
          return this.parsePrivateName();
        }
      case 33:
        {
          return this.parseTopicReferenceThenEqualsSign(54, "%");
        }
      case 32:
        {
          return this.parseTopicReferenceThenEqualsSign(44, "^");
        }
      case 37:
      case 38:
        {
          return this.parseTopicReference("hack");
        }
      case 44:
      case 54:
      case 27:
        {
          const pipeProposal = this.getPluginOption("pipelineOperator", "proposal");
          if (pipeProposal) {
            return this.parseTopicReference(pipeProposal);
          }
          throw this.unexpected();
        }
      case 47:
        {
          const lookaheadCh = this.input.codePointAt(this.nextTokenStart());
          if (isIdentifierStart(lookaheadCh) || lookaheadCh === 62) {
            throw this.expectOnePlugin(["jsx", "flow", "typescript"]);
          }
          throw this.unexpected();
        }
      default:
        if (type === 137) {
          return this.parseDecimalLiteral(this.state.value);
        } else if (type === 2 || type === 1) {
          return this.parseArrayLike(this.state.type === 2 ? 4 : 3, true);
        } else if (type === 6 || type === 7) {
          return this.parseObjectLike(this.state.type === 6 ? 9 : 8, false, true);
        }
        if (tokenIsIdentifier(type)) {
          if (this.isContextual(127) && this.lookaheadInLineCharCode() === 123) {
            return this.parseModuleExpression();
          }
          const canBeArrow = this.state.potentialArrowAt === this.state.start;
          const containsEsc = this.state.containsEsc;
          const id = this.parseIdentifier();
          if (!containsEsc && id.name === "async" && !this.canInsertSemicolon()) {
            const {
              type
            } = this.state;
            if (type === 68) {
              this.resetPreviousNodeTrailingComments(id);
              this.next();
              return this.parseAsyncFunctionExpression(this.startNodeAtNode(id));
            } else if (tokenIsIdentifier(type)) {
              if (canBeArrow && this.lookaheadCharCode() === 61) {
                return this.parseAsyncArrowUnaryFunction(this.startNodeAtNode(id));
              } else {
                return id;
              }
            } else if (type === 90) {
              this.resetPreviousNodeTrailingComments(id);
              return this.parseDo(this.startNodeAtNode(id), true);
            }
          }
          if (canBeArrow && this.match(19) && !this.canInsertSemicolon()) {
            this.next();
            return this.parseArrowExpression(this.startNodeAtNode(id), [id], false);
          }
          return id;
        } else {
          throw this.unexpected();
        }
    }
  }
  parseTopicReferenceThenEqualsSign(topicTokenType, topicTokenValue) {
    const pipeProposal = this.getPluginOption("pipelineOperator", "proposal");
    if (pipeProposal) {
      this.state.type = topicTokenType;
      this.state.value = topicTokenValue;
      this.state.pos--;
      this.state.end--;
      this.state.endLoc = createPositionWithColumnOffset(this.state.endLoc, -1);
      return this.parseTopicReference(pipeProposal);
    }
    throw this.unexpected();
  }
  parseTopicReference(pipeProposal) {
    const node = this.startNode();
    const startLoc = this.state.startLoc;
    const tokenType = this.state.type;
    this.next();
    return this.finishTopicReference(node, startLoc, pipeProposal, tokenType);
  }
  finishTopicReference(node, startLoc, pipeProposal, tokenType) {
    if (this.testTopicReferenceConfiguration(pipeProposal, startLoc, tokenType)) {
      if (pipeProposal === "hack") {
        if (!this.topicReferenceIsAllowedInCurrentContext()) {
          this.raise(Errors.PipeTopicUnbound, startLoc);
        }
        this.registerTopicReference();
        return this.finishNode(node, "TopicReference");
      } else {
        if (!this.topicReferenceIsAllowedInCurrentContext()) {
          this.raise(Errors.PrimaryTopicNotAllowed, startLoc);
        }
        this.registerTopicReference();
        return this.finishNode(node, "PipelinePrimaryTopicReference");
      }
    } else {
      throw this.raise(Errors.PipeTopicUnconfiguredToken, startLoc, {
        token: tokenLabelName(tokenType)
      });
    }
  }
  testTopicReferenceConfiguration(pipeProposal, startLoc, tokenType) {
    switch (pipeProposal) {
      case "hack":
        {
          return this.hasPlugin(["pipelineOperator", {
            topicToken: tokenLabelName(tokenType)
          }]);
        }
      case "smart":
        return tokenType === 27;
      default:
        throw this.raise(Errors.PipeTopicRequiresHackPipes, startLoc);
    }
  }
  parseAsyncArrowUnaryFunction(node) {
    this.prodParam.enter(functionFlags(true, this.prodParam.hasYield));
    const params = [this.parseIdentifier()];
    this.prodParam.exit();
    if (this.hasPrecedingLineBreak()) {
      this.raise(Errors.LineTerminatorBeforeArrow, this.state.curPosition());
    }
    this.expect(19);
    return this.parseArrowExpression(node, params, true);
  }
  parseDo(node, isAsync) {
    this.expectPlugin("doExpressions");
    if (isAsync) {
      this.expectPlugin("asyncDoExpressions");
    }
    node.async = isAsync;
    this.next();
    const oldLabels = this.state.labels;
    this.state.labels = [];
    if (isAsync) {
      this.prodParam.enter(2);
      node.body = this.parseBlock();
      this.prodParam.exit();
    } else {
      node.body = this.parseBlock();
    }
    this.state.labels = oldLabels;
    return this.finishNode(node, "DoExpression");
  }
  parseSuper() {
    const node = this.startNode();
    this.next();
    if (this.match(10) && !this.scope.allowDirectSuper) {
      if (!(this.optionFlags & 16)) {
        this.raise(Errors.SuperNotAllowed, node);
      }
    } else if (!this.scope.allowSuper) {
      if (!(this.optionFlags & 16)) {
        this.raise(Errors.UnexpectedSuper, node);
      }
    }
    if (!this.match(10) && !this.match(0) && !this.match(16)) {
      this.raise(Errors.UnsupportedSuper, node);
    }
    return this.finishNode(node, "Super");
  }
  parsePrivateName() {
    const node = this.startNode();
    const id = this.startNodeAt(createPositionWithColumnOffset(this.state.startLoc, 1));
    const name = this.state.value;
    this.next();
    node.id = this.createIdentifier(id, name);
    return this.finishNode(node, "PrivateName");
  }
  parseFunctionOrFunctionSent() {
    const node = this.startNode();
    this.next();
    if (this.prodParam.hasYield && this.match(16)) {
      const meta = this.createIdentifier(this.startNodeAtNode(node), "function");
      this.next();
      if (this.match(103)) {
        this.expectPlugin("functionSent");
      } else if (!this.hasPlugin("functionSent")) {
        this.unexpected();
      }
      return this.parseMetaProperty(node, meta, "sent");
    }
    return this.parseFunction(node);
  }
  parseMetaProperty(node, meta, propertyName) {
    node.meta = meta;
    const containsEsc = this.state.containsEsc;
    node.property = this.parseIdentifier(true);
    if (node.property.name !== propertyName || containsEsc) {
      this.raise(Errors.UnsupportedMetaProperty, node.property, {
        target: meta.name,
        onlyValidPropertyName: propertyName
      });
    }
    return this.finishNode(node, "MetaProperty");
  }
  parseImportMetaPropertyOrPhaseCall(node) {
    this.next();
    if (this.isContextual(105) || this.isContextual(97)) {
      const isSource = this.isContextual(105);
      this.expectPlugin(isSource ? "sourcePhaseImports" : "deferredImportEvaluation");
      this.next();
      node.phase = isSource ? "source" : "defer";
      return this.parseImportCall(node);
    } else {
      const id = this.createIdentifierAt(this.startNodeAtNode(node), "import", this.state.lastTokStartLoc);
      if (this.isContextual(101)) {
        if (!this.inModule) {
          this.raise(Errors.ImportMetaOutsideModule, id);
        }
        this.sawUnambiguousESM = true;
      }
      return this.parseMetaProperty(node, id, "meta");
    }
  }
  parseLiteralAtNode(value, type, node) {
    this.addExtra(node, "rawValue", value);
    this.addExtra(node, "raw", this.input.slice(this.offsetToSourcePos(node.start), this.state.end));
    node.value = value;
    this.next();
    return this.finishNode(node, type);
  }
  parseLiteral(value, type) {
    const node = this.startNode();
    return this.parseLiteralAtNode(value, type, node);
  }
  parseStringLiteral(value) {
    return this.parseLiteral(value, "StringLiteral");
  }
  parseNumericLiteral(value) {
    return this.parseLiteral(value, "NumericLiteral");
  }
  parseBigIntLiteral(value) {
    return this.parseLiteral(value, "BigIntLiteral");
  }
  parseDecimalLiteral(value) {
    return this.parseLiteral(value, "DecimalLiteral");
  }
  parseRegExpLiteral(value) {
    const node = this.startNode();
    this.addExtra(node, "raw", this.input.slice(this.offsetToSourcePos(node.start), this.state.end));
    node.pattern = value.pattern;
    node.flags = value.flags;
    this.next();
    return this.finishNode(node, "RegExpLiteral");
  }
  parseBooleanLiteral(value) {
    const node = this.startNode();
    node.value = value;
    this.next();
    return this.finishNode(node, "BooleanLiteral");
  }
  parseNullLiteral() {
    const node = this.startNode();
    this.next();
    return this.finishNode(node, "NullLiteral");
  }
  parseParenAndDistinguishExpression(canBeArrow) {
    const startLoc = this.state.startLoc;
    let val;
    this.next();
    this.expressionScope.enter(newArrowHeadScope());
    const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
    const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
    this.state.maybeInArrowParameters = true;
    this.state.inFSharpPipelineDirectBody = false;
    const innerStartLoc = this.state.startLoc;
    const exprList = [];
    const refExpressionErrors = new ExpressionErrors();
    let first = true;
    let spreadStartLoc;
    let optionalCommaStartLoc;
    while (!this.match(11)) {
      if (first) {
        first = false;
      } else {
        this.expect(12, refExpressionErrors.optionalParametersLoc === null ? null : refExpressionErrors.optionalParametersLoc);
        if (this.match(11)) {
          optionalCommaStartLoc = this.state.startLoc;
          break;
        }
      }
      if (this.match(21)) {
        const spreadNodeStartLoc = this.state.startLoc;
        spreadStartLoc = this.state.startLoc;
        exprList.push(this.parseParenItem(this.parseRestBinding(), spreadNodeStartLoc));
        if (!this.checkCommaAfterRest(41)) {
          break;
        }
      } else {
        exprList.push(this.parseMaybeAssignAllowInOrVoidPattern(11, refExpressionErrors, this.parseParenItem));
      }
    }
    const innerEndLoc = this.state.lastTokEndLoc;
    this.expect(11);
    this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
    this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
    let arrowNode = this.startNodeAt(startLoc);
    if (canBeArrow && this.shouldParseArrow(exprList) && (arrowNode = this.parseArrow(arrowNode))) {
      this.checkDestructuringPrivate(refExpressionErrors);
      this.expressionScope.validateAsPattern();
      this.expressionScope.exit();
      this.parseArrowExpression(arrowNode, exprList, false);
      return arrowNode;
    }
    this.expressionScope.exit();
    if (!exprList.length) {
      this.unexpected(this.state.lastTokStartLoc);
    }
    if (optionalCommaStartLoc) this.unexpected(optionalCommaStartLoc);
    if (spreadStartLoc) this.unexpected(spreadStartLoc);
    this.checkExpressionErrors(refExpressionErrors, true);
    this.toReferencedListDeep(exprList, true);
    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartLoc);
      val.expressions = exprList;
      this.finishNode(val, "SequenceExpression");
      this.resetEndLocation(val, innerEndLoc);
    } else {
      val = exprList[0];
    }
    return this.wrapParenthesis(startLoc, val);
  }
  wrapParenthesis(startLoc, expression) {
    if (!(this.optionFlags & 1024)) {
      this.addExtra(expression, "parenthesized", true);
      this.addExtra(expression, "parenStart", startLoc.index);
      this.takeSurroundingComments(expression, startLoc.index, this.state.lastTokEndLoc.index);
      return expression;
    }
    const parenExpression = this.startNodeAt(startLoc);
    parenExpression.expression = expression;
    return this.finishNode(parenExpression, "ParenthesizedExpression");
  }
  shouldParseArrow(params) {
    return !this.canInsertSemicolon();
  }
  parseArrow(node) {
    if (this.eat(19)) {
      return node;
    }
  }
  parseParenItem(node, startLoc) {
    return node;
  }
  parseNewOrNewTarget() {
    const node = this.startNode();
    this.next();
    if (this.match(16)) {
      const meta = this.createIdentifier(this.startNodeAtNode(node), "new");
      this.next();
      const metaProp = this.parseMetaProperty(node, meta, "target");
      if (!this.scope.allowNewTarget) {
        this.raise(Errors.UnexpectedNewTarget, metaProp);
      }
      return metaProp;
    }
    return this.parseNew(node);
  }
  parseNew(node) {
    this.parseNewCallee(node);
    if (this.eat(10)) {
      const args = this.parseExprList(11);
      this.toReferencedList(args);
      node.arguments = args;
    } else {
      node.arguments = [];
    }
    return this.finishNode(node, "NewExpression");
  }
  parseNewCallee(node) {
    const isImport = this.match(83);
    const callee = this.parseNoCallExpr();
    node.callee = callee;
    if (isImport && callee.type === "ImportExpression" || callee.type === "Import") {
      this.raise(Errors.ImportCallNotNewExpression, callee);
    }
    if (callee.type === "Super") {
      this.raise(Errors.SuperCallNotNewExpression, callee);
    }
  }
  parseTemplateElement(isTagged) {
    const {
      start,
      startLoc,
      end,
      value
    } = this.state;
    const elemStart = start + 1;
    const elem = this.startNodeAt(createPositionWithColumnOffset(startLoc, 1));
    if (value === null) {
      if (!isTagged) {
        this.raise(Errors.InvalidEscapeSequenceTemplate, createPositionWithColumnOffset(this.state.firstInvalidTemplateEscapePos, 1));
      }
    }
    const isTail = this.match(24);
    const endOffset = isTail ? -1 : -2;
    const elemEnd = end + endOffset;
    elem.value = {
      raw: this.input.slice(elemStart, elemEnd).replace(/\r\n?/g, "\n"),
      cooked: value === null ? null : value.slice(1, endOffset)
    };
    elem.tail = isTail;
    this.next();
    const finishedNode = this.finishNode(elem, "TemplateElement");
    this.resetEndLocation(finishedNode, createPositionWithColumnOffset(this.state.lastTokEndLoc, endOffset));
    return finishedNode;
  }
  parseTemplate(isTagged) {
    const node = this.startNode();
    let curElt = this.parseTemplateElement(isTagged);
    const quasis = [curElt];
    const substitutions = [];
    while (!curElt.tail) {
      substitutions.push(this.parseTemplateSubstitution());
      this.readTemplateContinuation();
      quasis.push(curElt = this.parseTemplateElement(isTagged));
    }
    node.expressions = substitutions;
    node.quasis = quasis;
    return this.finishNode(node, "TemplateLiteral");
  }
  parseTemplateSubstitution() {
    return this.parseExpression();
  }
  parseObjectLike(close, isPattern, isRecord, refExpressionErrors) {
    if (isRecord) {
      this.expectPlugin("recordAndTuple");
    }
    const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
    this.state.inFSharpPipelineDirectBody = false;
    let sawProto = false;
    let first = true;
    const node = this.startNode();
    node.properties = [];
    this.next();
    while (!this.match(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(12);
        if (this.match(close)) {
          this.addTrailingCommaExtraToNode(node);
          break;
        }
      }
      let prop;
      if (isPattern) {
        prop = this.parseBindingProperty();
      } else {
        prop = this.parsePropertyDefinition(refExpressionErrors);
        sawProto = this.checkProto(prop, isRecord, sawProto, refExpressionErrors);
      }
      if (isRecord && !this.isObjectProperty(prop) && prop.type !== "SpreadElement") {
        this.raise(Errors.InvalidRecordProperty, prop);
      }
      if (prop.shorthand) {
        this.addExtra(prop, "shorthand", true);
      }
      node.properties.push(prop);
    }
    this.next();
    this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
    let type = "ObjectExpression";
    if (isPattern) {
      type = "ObjectPattern";
    } else if (isRecord) {
      type = "RecordExpression";
    }
    return this.finishNode(node, type);
  }
  addTrailingCommaExtraToNode(node) {
    this.addExtra(node, "trailingComma", this.state.lastTokStartLoc.index);
    this.addExtra(node, "trailingCommaLoc", this.state.lastTokStartLoc, false);
  }
  maybeAsyncOrAccessorProp(prop) {
    return !prop.computed && prop.key.type === "Identifier" && (this.isLiteralPropertyName() || this.match(0) || this.match(55));
  }
  parsePropertyDefinition(refExpressionErrors) {
    let decorators = [];
    if (this.match(26)) {
      if (this.hasPlugin("decorators")) {
        this.raise(Errors.UnsupportedPropertyDecorator, this.state.startLoc);
      }
      while (this.match(26)) {
        decorators.push(this.parseDecorator());
      }
    }
    const prop = this.startNode();
    let isAsync = false;
    let isAccessor = false;
    let startLoc;
    if (this.match(21)) {
      if (decorators.length) this.unexpected();
      return this.parseSpread();
    }
    if (decorators.length) {
      prop.decorators = decorators;
      decorators = [];
    }
    prop.method = false;
    if (refExpressionErrors) {
      startLoc = this.state.startLoc;
    }
    let isGenerator = this.eat(55);
    this.parsePropertyNamePrefixOperator(prop);
    const containsEsc = this.state.containsEsc;
    this.parsePropertyName(prop, refExpressionErrors);
    if (!isGenerator && !containsEsc && this.maybeAsyncOrAccessorProp(prop)) {
      const {
        key
      } = prop;
      const keyName = key.name;
      if (keyName === "async" && !this.hasPrecedingLineBreak()) {
        isAsync = true;
        this.resetPreviousNodeTrailingComments(key);
        isGenerator = this.eat(55);
        this.parsePropertyName(prop);
      }
      if (keyName === "get" || keyName === "set") {
        isAccessor = true;
        this.resetPreviousNodeTrailingComments(key);
        prop.kind = keyName;
        if (this.match(55)) {
          isGenerator = true;
          this.raise(Errors.AccessorIsGenerator, this.state.curPosition(), {
            kind: keyName
          });
          this.next();
        }
        this.parsePropertyName(prop);
      }
    }
    return this.parseObjPropValue(prop, startLoc, isGenerator, isAsync, false, isAccessor, refExpressionErrors);
  }
  getGetterSetterExpectedParamCount(method) {
    return method.kind === "get" ? 0 : 1;
  }
  getObjectOrClassMethodParams(method) {
    return method.params;
  }
  checkGetterSetterParams(method) {
    var _params;
    const paramCount = this.getGetterSetterExpectedParamCount(method);
    const params = this.getObjectOrClassMethodParams(method);
    if (params.length !== paramCount) {
      this.raise(method.kind === "get" ? Errors.BadGetterArity : Errors.BadSetterArity, method);
    }
    if (method.kind === "set" && ((_params = params[params.length - 1]) == null ? void 0 : _params.type) === "RestElement") {
      this.raise(Errors.BadSetterRestParameter, method);
    }
  }
  parseObjectMethod(prop, isGenerator, isAsync, isPattern, isAccessor) {
    if (isAccessor) {
      const finishedProp = this.parseMethod(prop, isGenerator, false, false, false, "ObjectMethod");
      this.checkGetterSetterParams(finishedProp);
      return finishedProp;
    }
    if (isAsync || isGenerator || this.match(10)) {
      if (isPattern) this.unexpected();
      prop.kind = "method";
      prop.method = true;
      return this.parseMethod(prop, isGenerator, isAsync, false, false, "ObjectMethod");
    }
  }
  parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors) {
    prop.shorthand = false;
    if (this.eat(14)) {
      prop.value = isPattern ? this.parseMaybeDefault(this.state.startLoc) : this.parseMaybeAssignAllowInOrVoidPattern(8, refExpressionErrors);
      return this.finishObjectProperty(prop);
    }
    if (!prop.computed && prop.key.type === "Identifier") {
      this.checkReservedWord(prop.key.name, prop.key.loc.start, true, false);
      if (isPattern) {
        prop.value = this.parseMaybeDefault(startLoc, this.cloneIdentifier(prop.key));
      } else if (this.match(29)) {
        const shorthandAssignLoc = this.state.startLoc;
        if (refExpressionErrors != null) {
          if (refExpressionErrors.shorthandAssignLoc === null) {
            refExpressionErrors.shorthandAssignLoc = shorthandAssignLoc;
          }
        } else {
          this.raise(Errors.InvalidCoverInitializedName, shorthandAssignLoc);
        }
        prop.value = this.parseMaybeDefault(startLoc, this.cloneIdentifier(prop.key));
      } else {
        prop.value = this.cloneIdentifier(prop.key);
      }
      prop.shorthand = true;
      return this.finishObjectProperty(prop);
    }
  }
  finishObjectProperty(node) {
    return this.finishNode(node, "ObjectProperty");
  }
  parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors) {
    const node = this.parseObjectMethod(prop, isGenerator, isAsync, isPattern, isAccessor) || this.parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors);
    if (!node) this.unexpected();
    return node;
  }
  parsePropertyName(prop, refExpressionErrors) {
    if (this.eat(0)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssignAllowIn();
      this.expect(3);
    } else {
      const {
        type,
        value
      } = this.state;
      let key;
      if (tokenIsKeywordOrIdentifier(type)) {
        key = this.parseIdentifier(true);
      } else {
        switch (type) {
          case 135:
            key = this.parseNumericLiteral(value);
            break;
          case 134:
            key = this.parseStringLiteral(value);
            break;
          case 136:
            key = this.parseBigIntLiteral(value);
            break;
          case 139:
            {
              const privateKeyLoc = this.state.startLoc;
              if (refExpressionErrors != null) {
                if (refExpressionErrors.privateKeyLoc === null) {
                  refExpressionErrors.privateKeyLoc = privateKeyLoc;
                }
              } else {
                this.raise(Errors.UnexpectedPrivateField, privateKeyLoc);
              }
              key = this.parsePrivateName();
              break;
            }
          default:
            if (type === 137) {
              key = this.parseDecimalLiteral(value);
              break;
            }
            this.unexpected();
        }
      }
      prop.key = key;
      if (type !== 139) {
        prop.computed = false;
      }
    }
  }
  initFunction(node, isAsync) {
    node.id = null;
    node.generator = false;
    node.async = isAsync;
  }
  parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope = false) {
    this.initFunction(node, isAsync);
    node.generator = isGenerator;
    this.scope.enter(514 | 16 | (inClassScope ? 576 : 0) | (allowDirectSuper ? 32 : 0));
    this.prodParam.enter(functionFlags(isAsync, node.generator));
    this.parseFunctionParams(node, isConstructor);
    const finishedNode = this.parseFunctionBodyAndFinish(node, type, true);
    this.prodParam.exit();
    this.scope.exit();
    return finishedNode;
  }
  parseArrayLike(close, isTuple, refExpressionErrors) {
    if (isTuple) {
      this.expectPlugin("recordAndTuple");
    }
    const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
    this.state.inFSharpPipelineDirectBody = false;
    const node = this.startNode();
    this.next();
    node.elements = this.parseExprList(close, !isTuple, refExpressionErrors, node);
    this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
    return this.finishNode(node, isTuple ? "TupleExpression" : "ArrayExpression");
  }
  parseArrowExpression(node, params, isAsync, trailingCommaLoc) {
    this.scope.enter(514 | 4);
    let flags = functionFlags(isAsync, false);
    if (!this.match(5) && this.prodParam.hasIn) {
      flags |= 8;
    }
    this.prodParam.enter(flags);
    this.initFunction(node, isAsync);
    const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
    if (params) {
      this.state.maybeInArrowParameters = true;
      this.setArrowFunctionParameters(node, params, trailingCommaLoc);
    }
    this.state.maybeInArrowParameters = false;
    this.parseFunctionBody(node, true);
    this.prodParam.exit();
    this.scope.exit();
    this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
    return this.finishNode(node, "ArrowFunctionExpression");
  }
  setArrowFunctionParameters(node, params, trailingCommaLoc) {
    this.toAssignableList(params, trailingCommaLoc, false);
    node.params = params;
  }
  parseFunctionBodyAndFinish(node, type, isMethod = false) {
    this.parseFunctionBody(node, false, isMethod);
    return this.finishNode(node, type);
  }
  parseFunctionBody(node, allowExpression, isMethod = false) {
    const isExpression = allowExpression && !this.match(5);
    this.expressionScope.enter(newExpressionScope());
    if (isExpression) {
      node.body = this.parseMaybeAssign();
      this.checkParams(node, false, allowExpression, false);
    } else {
      const oldStrict = this.state.strict;
      const oldLabels = this.state.labels;
      this.state.labels = [];
      this.prodParam.enter(this.prodParam.currentFlags() | 4);
      node.body = this.parseBlock(true, false, hasStrictModeDirective => {
        const nonSimple = !this.isSimpleParamList(node.params);
        if (hasStrictModeDirective && nonSimple) {
          this.raise(Errors.IllegalLanguageModeDirective, (node.kind === "method" || node.kind === "constructor") && !!node.key ? node.key.loc.end : node);
        }
        const strictModeChanged = !oldStrict && this.state.strict;
        this.checkParams(node, !this.state.strict && !allowExpression && !isMethod && !nonSimple, allowExpression, strictModeChanged);
        if (this.state.strict && node.id) {
          this.checkIdentifier(node.id, 65, strictModeChanged);
        }
      });
      this.prodParam.exit();
      this.state.labels = oldLabels;
    }
    this.expressionScope.exit();
  }
  isSimpleParameter(node) {
    return node.type === "Identifier";
  }
  isSimpleParamList(params) {
    for (let i = 0, len = params.length; i < len; i++) {
      if (!this.isSimpleParameter(params[i])) return false;
    }
    return true;
  }
  checkParams(node, allowDuplicates, isArrowFunction, strictModeChanged = true) {
    const checkClashes = !allowDuplicates && new Set();
    const formalParameters = {
      type: "FormalParameters"
    };
    for (const param of node.params) {
      this.checkLVal(param, formalParameters, 5, checkClashes, strictModeChanged);
    }
  }
  parseExprList(close, allowEmpty, refExpressionErrors, nodeForExtra) {
    const elts = [];
    let first = true;
    while (!this.eat(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(12);
        if (this.match(close)) {
          if (nodeForExtra) {
            this.addTrailingCommaExtraToNode(nodeForExtra);
          }
          this.next();
          break;
        }
      }
      elts.push(this.parseExprListItem(close, allowEmpty, refExpressionErrors));
    }
    return elts;
  }
  parseExprListItem(close, allowEmpty, refExpressionErrors, allowPlaceholder) {
    let elt;
    if (this.match(12)) {
      if (!allowEmpty) {
        this.raise(Errors.UnexpectedToken, this.state.curPosition(), {
          unexpected: ","
        });
      }
      elt = null;
    } else if (this.match(21)) {
      const spreadNodeStartLoc = this.state.startLoc;
      elt = this.parseParenItem(this.parseSpread(refExpressionErrors), spreadNodeStartLoc);
    } else if (this.match(17)) {
      this.expectPlugin("partialApplication");
      if (!allowPlaceholder) {
        this.raise(Errors.UnexpectedArgumentPlaceholder, this.state.startLoc);
      }
      const node = this.startNode();
      this.next();
      elt = this.finishNode(node, "ArgumentPlaceholder");
    } else {
      elt = this.parseMaybeAssignAllowInOrVoidPattern(close, refExpressionErrors, this.parseParenItem);
    }
    return elt;
  }
  parseIdentifier(liberal) {
    const node = this.startNode();
    const name = this.parseIdentifierName(liberal);
    return this.createIdentifier(node, name);
  }
  createIdentifier(node, name) {
    node.name = name;
    node.loc.identifierName = name;
    return this.finishNode(node, "Identifier");
  }
  createIdentifierAt(node, name, endLoc) {
    node.name = name;
    node.loc.identifierName = name;
    return this.finishNodeAt(node, "Identifier", endLoc);
  }
  parseIdentifierName(liberal) {
    let name;
    const {
      startLoc,
      type
    } = this.state;
    if (tokenIsKeywordOrIdentifier(type)) {
      name = this.state.value;
    } else {
      this.unexpected();
    }
    const tokenIsKeyword = tokenKeywordOrIdentifierIsKeyword(type);
    if (liberal) {
      if (tokenIsKeyword) {
        this.replaceToken(132);
      }
    } else {
      this.checkReservedWord(name, startLoc, tokenIsKeyword, false);
    }
    this.next();
    return name;
  }
  checkReservedWord(word, startLoc, checkKeywords, isBinding) {
    if (word.length > 10) {
      return;
    }
    if (!canBeReservedWord(word)) {
      return;
    }
    if (checkKeywords && isKeyword(word)) {
      this.raise(Errors.UnexpectedKeyword, startLoc, {
        keyword: word
      });
      return;
    }
    const reservedTest = !this.state.strict ? isReservedWord : isBinding ? isStrictBindReservedWord : isStrictReservedWord;
    if (reservedTest(word, this.inModule)) {
      this.raise(Errors.UnexpectedReservedWord, startLoc, {
        reservedWord: word
      });
      return;
    } else if (word === "yield") {
      if (this.prodParam.hasYield) {
        this.raise(Errors.YieldBindingIdentifier, startLoc);
        return;
      }
    } else if (word === "await") {
      if (this.prodParam.hasAwait) {
        this.raise(Errors.AwaitBindingIdentifier, startLoc);
        return;
      }
      if (this.scope.inStaticBlock) {
        this.raise(Errors.AwaitBindingIdentifierInStaticBlock, startLoc);
        return;
      }
      this.expressionScope.recordAsyncArrowParametersError(startLoc);
    } else if (word === "arguments") {
      if (this.scope.inClassAndNotInNonArrowFunction) {
        this.raise(Errors.ArgumentsInClass, startLoc);
        return;
      }
    }
  }
  recordAwaitIfAllowed() {
    const isAwaitAllowed = this.prodParam.hasAwait;
    if (isAwaitAllowed && !this.scope.inFunction) {
      this.state.hasTopLevelAwait = true;
    }
    return isAwaitAllowed;
  }
  parseAwait(startLoc) {
    const node = this.startNodeAt(startLoc);
    this.expressionScope.recordParameterInitializerError(Errors.AwaitExpressionFormalParameter, node);
    if (this.eat(55)) {
      this.raise(Errors.ObsoleteAwaitStar, node);
    }
    if (!this.scope.inFunction && !(this.optionFlags & 1)) {
      if (this.isAmbiguousPrefixOrIdentifier()) {
        this.ambiguousScriptDifferentAst = true;
      } else {
        this.sawUnambiguousESM = true;
      }
    }
    if (!this.state.soloAwait) {
      node.argument = this.parseMaybeUnary(null, true);
    }
    return this.finishNode(node, "AwaitExpression");
  }
  isAmbiguousPrefixOrIdentifier() {
    if (this.hasPrecedingLineBreak()) return true;
    const {
      type
    } = this.state;
    return type === 53 || type === 10 || type === 0 || tokenIsTemplate(type) || type === 102 && !this.state.containsEsc || type === 138 || type === 56 || this.hasPlugin("v8intrinsic") && type === 54;
  }
  parseYield(startLoc) {
    const node = this.startNodeAt(startLoc);
    this.expressionScope.recordParameterInitializerError(Errors.YieldInParameter, node);
    let delegating = false;
    let argument = null;
    if (!this.hasPrecedingLineBreak()) {
      delegating = this.eat(55);
      switch (this.state.type) {
        case 13:
        case 140:
        case 8:
        case 11:
        case 3:
        case 9:
        case 14:
        case 12:
          if (!delegating) break;
        default:
          argument = this.parseMaybeAssign();
      }
    }
    node.delegate = delegating;
    node.argument = argument;
    return this.finishNode(node, "YieldExpression");
  }
  parseImportCall(node) {
    this.next();
    node.source = this.parseMaybeAssignAllowIn();
    node.options = null;
    if (this.eat(12)) {
      if (!this.match(11)) {
        node.options = this.parseMaybeAssignAllowIn();
        if (this.eat(12)) {
          this.addTrailingCommaExtraToNode(node.options);
          if (!this.match(11)) {
            do {
              this.parseMaybeAssignAllowIn();
            } while (this.eat(12) && !this.match(11));
            this.raise(Errors.ImportCallArity, node);
          }
        }
      } else {
        this.addTrailingCommaExtraToNode(node.source);
      }
    }
    this.expect(11);
    return this.finishNode(node, "ImportExpression");
  }
  checkPipelineAtInfixOperator(left, leftStartLoc) {
    if (this.hasPlugin(["pipelineOperator", {
      proposal: "smart"
    }])) {
      if (left.type === "SequenceExpression") {
        this.raise(Errors.PipelineHeadSequenceExpression, leftStartLoc);
      }
    }
  }
  parseSmartPipelineBodyInStyle(childExpr, startLoc) {
    if (this.isSimpleReference(childExpr)) {
      const bodyNode = this.startNodeAt(startLoc);
      bodyNode.callee = childExpr;
      return this.finishNode(bodyNode, "PipelineBareFunction");
    } else {
      const bodyNode = this.startNodeAt(startLoc);
      this.checkSmartPipeTopicBodyEarlyErrors(startLoc);
      bodyNode.expression = childExpr;
      return this.finishNode(bodyNode, "PipelineTopicExpression");
    }
  }
  isSimpleReference(expression) {
    switch (expression.type) {
      case "MemberExpression":
        return !expression.computed && this.isSimpleReference(expression.object);
      case "Identifier":
        return true;
      default:
        return false;
    }
  }
  checkSmartPipeTopicBodyEarlyErrors(startLoc) {
    if (this.match(19)) {
      throw this.raise(Errors.PipelineBodyNoArrow, this.state.startLoc);
    }
    if (!this.topicReferenceWasUsedInCurrentContext()) {
      this.raise(Errors.PipelineTopicUnused, startLoc);
    }
  }
  withTopicBindingContext(callback) {
    const outerContextTopicState = this.state.topicContext;
    this.state.topicContext = {
      maxNumOfResolvableTopics: 1,
      maxTopicIndex: null
    };
    try {
      return callback();
    } finally {
      this.state.topicContext = outerContextTopicState;
    }
  }
  withSmartMixTopicForbiddingContext(callback) {
    if (this.hasPlugin(["pipelineOperator", {
      proposal: "smart"
    }])) {
      const outerContextTopicState = this.state.topicContext;
      this.state.topicContext = {
        maxNumOfResolvableTopics: 0,
        maxTopicIndex: null
      };
      try {
        return callback();
      } finally {
        this.state.topicContext = outerContextTopicState;
      }
    } else {
      return callback();
    }
  }
  withSoloAwaitPermittingContext(callback) {
    const outerContextSoloAwaitState = this.state.soloAwait;
    this.state.soloAwait = true;
    try {
      return callback();
    } finally {
      this.state.soloAwait = outerContextSoloAwaitState;
    }
  }
  allowInAnd(callback) {
    const flags = this.prodParam.currentFlags();
    const prodParamToSet = 8 & ~flags;
    if (prodParamToSet) {
      this.prodParam.enter(flags | 8);
      try {
        return callback();
      } finally {
        this.prodParam.exit();
      }
    }
    return callback();
  }
  disallowInAnd(callback) {
    const flags = this.prodParam.currentFlags();
    const prodParamToClear = 8 & flags;
    if (prodParamToClear) {
      this.prodParam.enter(flags & ~8);
      try {
        return callback();
      } finally {
        this.prodParam.exit();
      }
    }
    return callback();
  }
  registerTopicReference() {
    this.state.topicContext.maxTopicIndex = 0;
  }
  topicReferenceIsAllowedInCurrentContext() {
    return this.state.topicContext.maxNumOfResolvableTopics >= 1;
  }
  topicReferenceWasUsedInCurrentContext() {
    return this.state.topicContext.maxTopicIndex != null && this.state.topicContext.maxTopicIndex >= 0;
  }
  parseFSharpPipelineBody(prec) {
    const startLoc = this.state.startLoc;
    this.state.potentialArrowAt = this.state.start;
    const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
    this.state.inFSharpPipelineDirectBody = true;
    const ret = this.parseExprOp(this.parseMaybeUnaryOrPrivate(), startLoc, prec);
    this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
    return ret;
  }
  parseModuleExpression() {
    this.expectPlugin("moduleBlocks");
    const node = this.startNode();
    this.next();
    if (!this.match(5)) {
      this.unexpected(null, 5);
    }
    const program = this.startNodeAt(this.state.endLoc);
    this.next();
    const revertScopes = this.initializeScopes(true);
    this.enterInitialScopes();
    try {
      node.body = this.parseProgram(program, 8, "module");
    } finally {
      revertScopes();
    }
    return this.finishNode(node, "ModuleExpression");
  }
  parseVoidPattern(refExpressionErrors) {
    this.expectPlugin("discardBinding");
    const node = this.startNode();
    if (refExpressionErrors != null) {
      refExpressionErrors.voidPatternLoc = this.state.startLoc;
    }
    this.next();
    return this.finishNode(node, "VoidPattern");
  }
  parseMaybeAssignAllowInOrVoidPattern(close, refExpressionErrors, afterLeftParse) {
    if (refExpressionErrors != null && this.match(88)) {
      const nextCode = this.lookaheadCharCode();
      if (nextCode === 44 || nextCode === (close === 3 ? 93 : close === 8 ? 125 : 41) || nextCode === 61) {
        return this.parseMaybeDefault(this.state.startLoc, this.parseVoidPattern(refExpressionErrors));
      }
    }
    return this.parseMaybeAssignAllowIn(refExpressionErrors, afterLeftParse);
  }
  parsePropertyNamePrefixOperator(prop) {}
}
const loopLabel = {
    kind: 1
  },
  switchLabel = {
    kind: 2
  };
const loneSurrogate = /[\uD800-\uDFFF]/u;
const keywordRelationalOperator = /in(?:stanceof)?/y;
function babel7CompatTokens(tokens, input, startIndex) {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const {
      type
    } = token;
    if (typeof type === "number") {
      if (type === 139) {
        const {
          loc,
          start,
          value,
          end
        } = token;
        const hashEndPos = start + 1;
        const hashEndLoc = createPositionWithColumnOffset(loc.start, 1);
        tokens.splice(i, 1, new Token({
          type: getExportedToken(27),
          value: "#",
          start: start,
          end: hashEndPos,
          startLoc: loc.start,
          endLoc: hashEndLoc
        }), new Token({
          type: getExportedToken(132),
          value: value,
          start: hashEndPos,
          end: end,
          startLoc: hashEndLoc,
          endLoc: loc.end
        }));
        i++;
        continue;
      }
      if (tokenIsTemplate(type)) {
        const {
          loc,
          start,
          value,
          end
        } = token;
        const backquoteEnd = start + 1;
        const backquoteEndLoc = createPositionWithColumnOffset(loc.start, 1);
        let startToken;
        if (input.charCodeAt(start - startIndex) === 96) {
          startToken = new Token({
            type: getExportedToken(22),
            value: "`",
            start: start,
            end: backquoteEnd,
            startLoc: loc.start,
            endLoc: backquoteEndLoc
          });
        } else {
          startToken = new Token({
            type: getExportedToken(8),
            value: "}",
            start: start,
            end: backquoteEnd,
            startLoc: loc.start,
            endLoc: backquoteEndLoc
          });
        }
        let templateValue, templateElementEnd, templateElementEndLoc, endToken;
        if (type === 24) {
          templateElementEnd = end - 1;
          templateElementEndLoc = createPositionWithColumnOffset(loc.end, -1);
          templateValue = value === null ? null : value.slice(1, -1);
          endToken = new Token({
            type: getExportedToken(22),
            value: "`",
            start: templateElementEnd,
            end: end,
            startLoc: templateElementEndLoc,
            endLoc: loc.end
          });
        } else {
          templateElementEnd = end - 2;
          templateElementEndLoc = createPositionWithColumnOffset(loc.end, -2);
          templateValue = value === null ? null : value.slice(1, -2);
          endToken = new Token({
            type: getExportedToken(23),
            value: "${",
            start: templateElementEnd,
            end: end,
            startLoc: templateElementEndLoc,
            endLoc: loc.end
          });
        }
        tokens.splice(i, 1, startToken, new Token({
          type: getExportedToken(20),
          value: templateValue,
          start: backquoteEnd,
          end: templateElementEnd,
          startLoc: backquoteEndLoc,
          endLoc: templateElementEndLoc
        }), endToken);
        i += 2;
        continue;
      }
      token.type = getExportedToken(type);
    }
  }
  return tokens;
}
class StatementParser extends ExpressionParser {
  parseTopLevel(file, program) {
    file.program = this.parseProgram(program, 140, this.options.sourceType === "module" ? "module" : "script");
    file.comments = this.comments;
    if (this.optionFlags & 256) {
      file.tokens = babel7CompatTokens(this.tokens, this.input, this.startIndex);
    }
    return this.finishNode(file, "File");
  }
  parseProgram(program, end, sourceType) {
    program.sourceType = sourceType;
    program.interpreter = this.parseInterpreterDirective();
    this.parseBlockBody(program, true, true, end);
    if (this.inModule) {
      if (!(this.optionFlags & 64) && this.scope.undefinedExports.size > 0) {
        for (const [localName, at] of Array.from(this.scope.undefinedExports)) {
          this.raise(Errors.ModuleExportUndefined, at, {
            localName
          });
        }
      }
      this.addExtra(program, "topLevelAwait", this.state.hasTopLevelAwait);
    }
    let finishedProgram;
    if (end === 140) {
      finishedProgram = this.finishNode(program, "Program");
    } else {
      finishedProgram = this.finishNodeAt(program, "Program", createPositionWithColumnOffset(this.state.startLoc, -1));
    }
    return finishedProgram;
  }
  stmtToDirective(stmt) {
    const directive = this.castNodeTo(stmt, "Directive");
    const directiveLiteral = this.castNodeTo(stmt.expression, "DirectiveLiteral");
    const expressionValue = directiveLiteral.value;
    const raw = this.input.slice(this.offsetToSourcePos(directiveLiteral.start), this.offsetToSourcePos(directiveLiteral.end));
    const val = directiveLiteral.value = raw.slice(1, -1);
    this.addExtra(directiveLiteral, "raw", raw);
    this.addExtra(directiveLiteral, "rawValue", val);
    this.addExtra(directiveLiteral, "expressionValue", expressionValue);
    directive.value = directiveLiteral;
    delete stmt.expression;
    return directive;
  }
  parseInterpreterDirective() {
    if (!this.match(28)) {
      return null;
    }
    const node = this.startNode();
    node.value = this.state.value;
    this.next();
    return this.finishNode(node, "InterpreterDirective");
  }
  isLet() {
    if (!this.isContextual(100)) {
      return false;
    }
    return this.hasFollowingBindingAtom();
  }
  isUsing() {
    if (!this.isContextual(107)) {
      return false;
    }
    return this.nextTokenIsIdentifierOnSameLine();
  }
  isForUsing() {
    if (!this.isContextual(107)) {
      return false;
    }
    const next = this.nextTokenInLineStart();
    const nextCh = this.codePointAtPos(next);
    if (this.isUnparsedContextual(next, "of")) {
      const nextCharAfterOf = this.lookaheadCharCodeSince(next + 2);
      if (nextCharAfterOf !== 61 && nextCharAfterOf !== 58 && nextCharAfterOf !== 59) {
        return false;
      }
    }
    if (this.chStartsBindingIdentifier(nextCh, next) || this.isUnparsedContextual(next, "void")) {
      return true;
    }
    return false;
  }
  nextTokenIsIdentifierOnSameLine() {
    const next = this.nextTokenInLineStart();
    const nextCh = this.codePointAtPos(next);
    return this.chStartsBindingIdentifier(nextCh, next);
  }
  isAwaitUsing() {
    if (!this.isContextual(96)) {
      return false;
    }
    let next = this.nextTokenInLineStart();
    if (this.isUnparsedContextual(next, "using")) {
      next = this.nextTokenInLineStartSince(next + 5);
      const nextCh = this.codePointAtPos(next);
      if (this.chStartsBindingIdentifier(nextCh, next)) {
        return true;
      }
    }
    return false;
  }
  chStartsBindingIdentifier(ch, pos) {
    if (isIdentifierStart(ch)) {
      keywordRelationalOperator.lastIndex = pos;
      if (keywordRelationalOperator.test(this.input)) {
        const endCh = this.codePointAtPos(keywordRelationalOperator.lastIndex);
        if (!isIdentifierChar(endCh) && endCh !== 92) {
          return false;
        }
      }
      return true;
    } else if (ch === 92) {
      return true;
    } else {
      return false;
    }
  }
  chStartsBindingPattern(ch) {
    return ch === 91 || ch === 123;
  }
  hasFollowingBindingAtom() {
    const next = this.nextTokenStart();
    const nextCh = this.codePointAtPos(next);
    return this.chStartsBindingPattern(nextCh) || this.chStartsBindingIdentifier(nextCh, next);
  }
  hasInLineFollowingBindingIdentifierOrBrace() {
    const next = this.nextTokenInLineStart();
    const nextCh = this.codePointAtPos(next);
    return nextCh === 123 || this.chStartsBindingIdentifier(nextCh, next);
  }
  allowsUsing() {
    return (this.scope.inModule || !this.scope.inTopLevel) && !this.scope.inBareCaseStatement;
  }
  parseModuleItem() {
    return this.parseStatementLike(1 | 2 | 4 | 8);
  }
  parseStatementListItem() {
    return this.parseStatementLike(2 | 4 | (!this.options.annexB || this.state.strict ? 0 : 8));
  }
  parseStatementOrSloppyAnnexBFunctionDeclaration(allowLabeledFunction = false) {
    let flags = 0;
    if (this.options.annexB && !this.state.strict) {
      flags |= 4;
      if (allowLabeledFunction) {
        flags |= 8;
      }
    }
    return this.parseStatementLike(flags);
  }
  parseStatement() {
    return this.parseStatementLike(0);
  }
  parseStatementLike(flags) {
    let decorators = null;
    if (this.match(26)) {
      decorators = this.parseDecorators(true);
    }
    return this.parseStatementContent(flags, decorators);
  }
  parseStatementContent(flags, decorators) {
    const startType = this.state.type;
    const node = this.startNode();
    const allowDeclaration = !!(flags & 2);
    const allowFunctionDeclaration = !!(flags & 4);
    const topLevel = flags & 1;
    switch (startType) {
      case 60:
        return this.parseBreakContinueStatement(node, true);
      case 63:
        return this.parseBreakContinueStatement(node, false);
      case 64:
        return this.parseDebuggerStatement(node);
      case 90:
        return this.parseDoWhileStatement(node);
      case 91:
        return this.parseForStatement(node);
      case 68:
        if (this.lookaheadCharCode() === 46) break;
        if (!allowFunctionDeclaration) {
          this.raise(this.state.strict ? Errors.StrictFunction : this.options.annexB ? Errors.SloppyFunctionAnnexB : Errors.SloppyFunction, this.state.startLoc);
        }
        return this.parseFunctionStatement(node, false, !allowDeclaration && allowFunctionDeclaration);
      case 80:
        if (!allowDeclaration) this.unexpected();
        return this.parseClass(this.maybeTakeDecorators(decorators, node), true);
      case 69:
        return this.parseIfStatement(node);
      case 70:
        return this.parseReturnStatement(node);
      case 71:
        return this.parseSwitchStatement(node);
      case 72:
        return this.parseThrowStatement(node);
      case 73:
        return this.parseTryStatement(node);
      case 96:
        if (this.isAwaitUsing()) {
          if (!this.allowsUsing()) {
            this.raise(Errors.UnexpectedUsingDeclaration, node);
          } else if (!allowDeclaration) {
            this.raise(Errors.UnexpectedLexicalDeclaration, node);
          } else if (!this.recordAwaitIfAllowed()) {
            this.raise(Errors.AwaitUsingNotInAsyncContext, node);
          }
          this.next();
          return this.parseVarStatement(node, "await using");
        }
        break;
      case 107:
        if (this.state.containsEsc || !this.hasInLineFollowingBindingIdentifierOrBrace()) {
          break;
        }
        if (!this.allowsUsing()) {
          this.raise(Errors.UnexpectedUsingDeclaration, this.state.startLoc);
        } else if (!allowDeclaration) {
          this.raise(Errors.UnexpectedLexicalDeclaration, this.state.startLoc);
        }
        return this.parseVarStatement(node, "using");
      case 100:
        {
          if (this.state.containsEsc) {
            break;
          }
          const next = this.nextTokenStart();
          const nextCh = this.codePointAtPos(next);
          if (nextCh !== 91) {
            if (!allowDeclaration && this.hasFollowingLineBreak()) break;
            if (!this.chStartsBindingIdentifier(nextCh, next) && nextCh !== 123) {
              break;
            }
          }
        }
      case 75:
        {
          if (!allowDeclaration) {
            this.raise(Errors.UnexpectedLexicalDeclaration, this.state.startLoc);
          }
        }
      case 74:
        {
          const kind = this.state.value;
          return this.parseVarStatement(node, kind);
        }
      case 92:
        return this.parseWhileStatement(node);
      case 76:
        return this.parseWithStatement(node);
      case 5:
        return this.parseBlock();
      case 13:
        return this.parseEmptyStatement(node);
      case 83:
        {
          const nextTokenCharCode = this.lookaheadCharCode();
          if (nextTokenCharCode === 40 || nextTokenCharCode === 46) {
            break;
          }
        }
      case 82:
        {
          if (!(this.optionFlags & 8) && !topLevel) {
            this.raise(Errors.UnexpectedImportExport, this.state.startLoc);
          }
          this.next();
          let result;
          if (startType === 83) {
            result = this.parseImport(node);
          } else {
            result = this.parseExport(node, decorators);
          }
          this.assertModuleNodeAllowed(result);
          return result;
        }
      default:
        {
          if (this.isAsyncFunction()) {
            if (!allowDeclaration) {
              this.raise(Errors.AsyncFunctionInSingleStatementContext, this.state.startLoc);
            }
            this.next();
            return this.parseFunctionStatement(node, true, !allowDeclaration && allowFunctionDeclaration);
          }
        }
    }
    const maybeName = this.state.value;
    const expr = this.parseExpression();
    if (tokenIsIdentifier(startType) && expr.type === "Identifier" && this.eat(14)) {
      return this.parseLabeledStatement(node, maybeName, expr, flags);
    } else {
      return this.parseExpressionStatement(node, expr, decorators);
    }
  }
  assertModuleNodeAllowed(node) {
    if (!(this.optionFlags & 8) && !this.inModule) {
      this.raise(Errors.ImportOutsideModule, node);
    }
  }
  decoratorsEnabledBeforeExport() {
    if (this.hasPlugin("decorators-legacy")) return true;
    return this.hasPlugin("decorators") && this.getPluginOption("decorators", "decoratorsBeforeExport") !== false;
  }
  maybeTakeDecorators(maybeDecorators, classNode, exportNode) {
    if (maybeDecorators) {
      var _classNode$decorators;
      if ((_classNode$decorators = classNode.decorators) != null && _classNode$decorators.length) {
        if (typeof this.getPluginOption("decorators", "decoratorsBeforeExport") !== "boolean") {
          this.raise(Errors.DecoratorsBeforeAfterExport, classNode.decorators[0]);
        }
        classNode.decorators.unshift(...maybeDecorators);
      } else {
        classNode.decorators = maybeDecorators;
      }
      this.resetStartLocationFromNode(classNode, maybeDecorators[0]);
      if (exportNode) this.resetStartLocationFromNode(exportNode, classNode);
    }
    return classNode;
  }
  canHaveLeadingDecorator() {
    return this.match(80);
  }
  parseDecorators(allowExport) {
    const decorators = [];
    do {
      decorators.push(this.parseDecorator());
    } while (this.match(26));
    if (this.match(82)) {
      if (!allowExport) {
        this.unexpected();
      }
      if (!this.decoratorsEnabledBeforeExport()) {
        this.raise(Errors.DecoratorExportClass, this.state.startLoc);
      }
    } else if (!this.canHaveLeadingDecorator()) {
      throw this.raise(Errors.UnexpectedLeadingDecorator, this.state.startLoc);
    }
    return decorators;
  }
  parseDecorator() {
    this.expectOnePlugin(["decorators", "decorators-legacy"]);
    const node = this.startNode();
    this.next();
    if (this.hasPlugin("decorators")) {
      const startLoc = this.state.startLoc;
      let expr;
      if (this.match(10)) {
        const startLoc = this.state.startLoc;
        this.next();
        expr = this.parseExpression();
        this.expect(11);
        expr = this.wrapParenthesis(startLoc, expr);
        const paramsStartLoc = this.state.startLoc;
        node.expression = this.parseMaybeDecoratorArguments(expr, startLoc);
        if (this.getPluginOption("decorators", "allowCallParenthesized") === false && node.expression !== expr) {
          this.raise(Errors.DecoratorArgumentsOutsideParentheses, paramsStartLoc);
        }
      } else {
        expr = this.parseIdentifier(false);
        while (this.eat(16)) {
          const node = this.startNodeAt(startLoc);
          node.object = expr;
          if (this.match(139)) {
            this.classScope.usePrivateName(this.state.value, this.state.startLoc);
            node.property = this.parsePrivateName();
          } else {
            node.property = this.parseIdentifier(true);
          }
          node.computed = false;
          expr = this.finishNode(node, "MemberExpression");
        }
        node.expression = this.parseMaybeDecoratorArguments(expr, startLoc);
      }
    } else {
      node.expression = this.parseExprSubscripts();
    }
    return this.finishNode(node, "Decorator");
  }
  parseMaybeDecoratorArguments(expr, startLoc) {
    if (this.eat(10)) {
      const node = this.startNodeAt(startLoc);
      node.callee = expr;
      node.arguments = this.parseCallExpressionArguments();
      this.toReferencedList(node.arguments);
      return this.finishNode(node, "CallExpression");
    }
    return expr;
  }
  parseBreakContinueStatement(node, isBreak) {
    this.next();
    if (this.isLineTerminator()) {
      node.label = null;
    } else {
      node.label = this.parseIdentifier();
      this.semicolon();
    }
    this.verifyBreakContinue(node, isBreak);
    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
  }
  verifyBreakContinue(node, isBreak) {
    let i;
    for (i = 0; i < this.state.labels.length; ++i) {
      const lab = this.state.labels[i];
      if (node.label == null || lab.name === node.label.name) {
        if (lab.kind != null && (isBreak || lab.kind === 1)) {
          break;
        }
        if (node.label && isBreak) break;
      }
    }
    if (i === this.state.labels.length) {
      const type = isBreak ? "BreakStatement" : "ContinueStatement";
      this.raise(Errors.IllegalBreakContinue, node, {
        type
      });
    }
  }
  parseDebuggerStatement(node) {
    this.next();
    this.semicolon();
    return this.finishNode(node, "DebuggerStatement");
  }
  parseHeaderExpression() {
    this.expect(10);
    const val = this.parseExpression();
    this.expect(11);
    return val;
  }
  parseDoWhileStatement(node) {
    this.next();
    this.state.labels.push(loopLabel);
    node.body = this.withSmartMixTopicForbiddingContext(() => this.parseStatement());
    this.state.labels.pop();
    this.expect(92);
    node.test = this.parseHeaderExpression();
    this.eat(13);
    return this.finishNode(node, "DoWhileStatement");
  }
  parseForStatement(node) {
    this.next();
    this.state.labels.push(loopLabel);
    let awaitAt = null;
    if (this.isContextual(96) && this.recordAwaitIfAllowed()) {
      awaitAt = this.state.startLoc;
      this.next();
    }
    this.scope.enter(0);
    this.expect(10);
    if (this.match(13)) {
      if (awaitAt !== null) {
        this.unexpected(awaitAt);
      }
      return this.parseFor(node, null);
    }
    const startsWithLet = this.isContextual(100);
    {
      const startsWithAwaitUsing = this.isAwaitUsing();
      const starsWithUsingDeclaration = startsWithAwaitUsing || this.isForUsing();
      const isLetOrUsing = startsWithLet && this.hasFollowingBindingAtom() || starsWithUsingDeclaration;
      if (this.match(74) || this.match(75) || isLetOrUsing) {
        const initNode = this.startNode();
        let kind;
        if (startsWithAwaitUsing) {
          kind = "await using";
          if (!this.recordAwaitIfAllowed()) {
            this.raise(Errors.AwaitUsingNotInAsyncContext, this.state.startLoc);
          }
          this.next();
        } else {
          kind = this.state.value;
        }
        this.next();
        this.parseVar(initNode, true, kind);
        const init = this.finishNode(initNode, "VariableDeclaration");
        const isForIn = this.match(58);
        if (isForIn && starsWithUsingDeclaration) {
          this.raise(Errors.ForInUsing, init);
        }
        if ((isForIn || this.isContextual(102)) && init.declarations.length === 1) {
          return this.parseForIn(node, init, awaitAt);
        }
        if (awaitAt !== null) {
          this.unexpected(awaitAt);
        }
        return this.parseFor(node, init);
      }
    }
    const startsWithAsync = this.isContextual(95);
    const refExpressionErrors = new ExpressionErrors();
    const init = this.parseExpression(true, refExpressionErrors);
    const isForOf = this.isContextual(102);
    if (isForOf) {
      if (startsWithLet) {
        this.raise(Errors.ForOfLet, init);
      }
      if (awaitAt === null && startsWithAsync && init.type === "Identifier") {
        this.raise(Errors.ForOfAsync, init);
      }
    }
    if (isForOf || this.match(58)) {
      this.checkDestructuringPrivate(refExpressionErrors);
      this.toAssignable(init, true);
      const type = isForOf ? "ForOfStatement" : "ForInStatement";
      this.checkLVal(init, {
        type
      });
      return this.parseForIn(node, init, awaitAt);
    } else {
      this.checkExpressionErrors(refExpressionErrors, true);
    }
    if (awaitAt !== null) {
      this.unexpected(awaitAt);
    }
    return this.parseFor(node, init);
  }
  parseFunctionStatement(node, isAsync, isHangingDeclaration) {
    this.next();
    return this.parseFunction(node, 1 | (isHangingDeclaration ? 2 : 0) | (isAsync ? 8 : 0));
  }
  parseIfStatement(node) {
    this.next();
    node.test = this.parseHeaderExpression();
    node.consequent = this.parseStatementOrSloppyAnnexBFunctionDeclaration();
    node.alternate = this.eat(66) ? this.parseStatementOrSloppyAnnexBFunctionDeclaration() : null;
    return this.finishNode(node, "IfStatement");
  }
  parseReturnStatement(node) {
    if (!this.prodParam.hasReturn) {
      this.raise(Errors.IllegalReturn, this.state.startLoc);
    }
    this.next();
    if (this.isLineTerminator()) {
      node.argument = null;
    } else {
      node.argument = this.parseExpression();
      this.semicolon();
    }
    return this.finishNode(node, "ReturnStatement");
  }
  parseSwitchStatement(node) {
    this.next();
    node.discriminant = this.parseHeaderExpression();
    const cases = node.cases = [];
    this.expect(5);
    this.state.labels.push(switchLabel);
    this.scope.enter(256);
    let cur;
    for (let sawDefault; !this.match(8);) {
      if (this.match(61) || this.match(65)) {
        const isCase = this.match(61);
        if (cur) this.finishNode(cur, "SwitchCase");
        cases.push(cur = this.startNode());
        cur.consequent = [];
        this.next();
        if (isCase) {
          cur.test = this.parseExpression();
        } else {
          if (sawDefault) {
            this.raise(Errors.MultipleDefaultsInSwitch, this.state.lastTokStartLoc);
          }
          sawDefault = true;
          cur.test = null;
        }
        this.expect(14);
      } else {
        if (cur) {
          cur.consequent.push(this.parseStatementListItem());
        } else {
          this.unexpected();
        }
      }
    }
    this.scope.exit();
    if (cur) this.finishNode(cur, "SwitchCase");
    this.next();
    this.state.labels.pop();
    return this.finishNode(node, "SwitchStatement");
  }
  parseThrowStatement(node) {
    this.next();
    if (this.hasPrecedingLineBreak()) {
      this.raise(Errors.NewlineAfterThrow, this.state.lastTokEndLoc);
    }
    node.argument = this.parseExpression();
    this.semicolon();
    return this.finishNode(node, "ThrowStatement");
  }
  parseCatchClauseParam() {
    const param = this.parseBindingAtom();
    this.scope.enter(this.options.annexB && param.type === "Identifier" ? 8 : 0);
    this.checkLVal(param, {
      type: "CatchClause"
    }, 9);
    return param;
  }
  parseTryStatement(node) {
    this.next();
    node.block = this.parseBlock();
    node.handler = null;
    if (this.match(62)) {
      const clause = this.startNode();
      this.next();
      if (this.match(10)) {
        this.expect(10);
        clause.param = this.parseCatchClauseParam();
        this.expect(11);
      } else {
        clause.param = null;
        this.scope.enter(0);
      }
      clause.body = this.withSmartMixTopicForbiddingContext(() => this.parseBlock(false, false));
      this.scope.exit();
      node.handler = this.finishNode(clause, "CatchClause");
    }
    node.finalizer = this.eat(67) ? this.parseBlock() : null;
    if (!node.handler && !node.finalizer) {
      this.raise(Errors.NoCatchOrFinally, node);
    }
    return this.finishNode(node, "TryStatement");
  }
  parseVarStatement(node, kind, allowMissingInitializer = false) {
    this.next();
    this.parseVar(node, false, kind, allowMissingInitializer);
    this.semicolon();
    return this.finishNode(node, "VariableDeclaration");
  }
  parseWhileStatement(node) {
    this.next();
    node.test = this.parseHeaderExpression();
    this.state.labels.push(loopLabel);
    node.body = this.withSmartMixTopicForbiddingContext(() => this.parseStatement());
    this.state.labels.pop();
    return this.finishNode(node, "WhileStatement");
  }
  parseWithStatement(node) {
    if (this.state.strict) {
      this.raise(Errors.StrictWith, this.state.startLoc);
    }
    this.next();
    node.object = this.parseHeaderExpression();
    node.body = this.withSmartMixTopicForbiddingContext(() => this.parseStatement());
    return this.finishNode(node, "WithStatement");
  }
  parseEmptyStatement(node) {
    this.next();
    return this.finishNode(node, "EmptyStatement");
  }
  parseLabeledStatement(node, maybeName, expr, flags) {
    for (const label of this.state.labels) {
      if (label.name === maybeName) {
        this.raise(Errors.LabelRedeclaration, expr, {
          labelName: maybeName
        });
      }
    }
    const kind = tokenIsLoop(this.state.type) ? 1 : this.match(71) ? 2 : null;
    for (let i = this.state.labels.length - 1; i >= 0; i--) {
      const label = this.state.labels[i];
      if (label.statementStart === node.start) {
        label.statementStart = this.sourceToOffsetPos(this.state.start);
        label.kind = kind;
      } else {
        break;
      }
    }
    this.state.labels.push({
      name: maybeName,
      kind: kind,
      statementStart: this.sourceToOffsetPos(this.state.start)
    });
    node.body = flags & 8 ? this.parseStatementOrSloppyAnnexBFunctionDeclaration(true) : this.parseStatement();
    this.state.labels.pop();
    node.label = expr;
    return this.finishNode(node, "LabeledStatement");
  }
  parseExpressionStatement(node, expr, decorators) {
    node.expression = expr;
    this.semicolon();
    return this.finishNode(node, "ExpressionStatement");
  }
  parseBlock(allowDirectives = false, createNewLexicalScope = true, afterBlockParse) {
    const node = this.startNode();
    if (allowDirectives) {
      this.state.strictErrors.clear();
    }
    this.expect(5);
    if (createNewLexicalScope) {
      this.scope.enter(0);
    }
    this.parseBlockBody(node, allowDirectives, false, 8, afterBlockParse);
    if (createNewLexicalScope) {
      this.scope.exit();
    }
    return this.finishNode(node, "BlockStatement");
  }
  isValidDirective(stmt) {
    return stmt.type === "ExpressionStatement" && stmt.expression.type === "StringLiteral" && !stmt.expression.extra.parenthesized;
  }
  parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse) {
    const body = node.body = [];
    const directives = node.directives = [];
    this.parseBlockOrModuleBlockBody(body, allowDirectives ? directives : undefined, topLevel, end, afterBlockParse);
  }
  parseBlockOrModuleBlockBody(body, directives, topLevel, end, afterBlockParse) {
    const oldStrict = this.state.strict;
    let hasStrictModeDirective = false;
    let parsedNonDirective = false;
    while (!this.match(end)) {
      const stmt = topLevel ? this.parseModuleItem() : this.parseStatementListItem();
      if (directives && !parsedNonDirective) {
        if (this.isValidDirective(stmt)) {
          const directive = this.stmtToDirective(stmt);
          directives.push(directive);
          if (!hasStrictModeDirective && directive.value.value === "use strict") {
            hasStrictModeDirective = true;
            this.setStrict(true);
          }
          continue;
        }
        parsedNonDirective = true;
        this.state.strictErrors.clear();
      }
      body.push(stmt);
    }
    afterBlockParse == null || afterBlockParse.call(this, hasStrictModeDirective);
    if (!oldStrict) {
      this.setStrict(false);
    }
    this.next();
  }
  parseFor(node, init) {
    node.init = init;
    this.semicolon(false);
    node.test = this.match(13) ? null : this.parseExpression();
    this.semicolon(false);
    node.update = this.match(11) ? null : this.parseExpression();
    this.expect(11);
    node.body = this.withSmartMixTopicForbiddingContext(() => this.parseStatement());
    this.scope.exit();
    this.state.labels.pop();
    return this.finishNode(node, "ForStatement");
  }
  parseForIn(node, init, awaitAt) {
    const isForIn = this.match(58);
    this.next();
    if (isForIn) {
      if (awaitAt !== null) this.unexpected(awaitAt);
    } else {
      node.await = awaitAt !== null;
    }
    if (init.type === "VariableDeclaration" && init.declarations[0].init != null && (!isForIn || !this.options.annexB || this.state.strict || init.kind !== "var" || init.declarations[0].id.type !== "Identifier")) {
      this.raise(Errors.ForInOfLoopInitializer, init, {
        type: isForIn ? "ForInStatement" : "ForOfStatement"
      });
    }
    if (init.type === "AssignmentPattern") {
      this.raise(Errors.InvalidLhs, init, {
        ancestor: {
          type: "ForStatement"
        }
      });
    }
    node.left = init;
    node.right = isForIn ? this.parseExpression() : this.parseMaybeAssignAllowIn();
    this.expect(11);
    node.body = this.withSmartMixTopicForbiddingContext(() => this.parseStatement());
    this.scope.exit();
    this.state.labels.pop();
    return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement");
  }
  parseVar(node, isFor, kind, allowMissingInitializer = false) {
    const declarations = node.declarations = [];
    node.kind = kind;
    for (;;) {
      const decl = this.startNode();
      this.parseVarId(decl, kind);
      decl.init = !this.eat(29) ? null : isFor ? this.parseMaybeAssignDisallowIn() : this.parseMaybeAssignAllowIn();
      if (decl.init === null && !allowMissingInitializer) {
        if (decl.id.type !== "Identifier" && !(isFor && (this.match(58) || this.isContextual(102)))) {
          this.raise(Errors.DeclarationMissingInitializer, this.state.lastTokEndLoc, {
            kind: "destructuring"
          });
        } else if ((kind === "const" || kind === "using" || kind === "await using") && !(this.match(58) || this.isContextual(102))) {
          this.raise(Errors.DeclarationMissingInitializer, this.state.lastTokEndLoc, {
            kind
          });
        }
      }
      declarations.push(this.finishNode(decl, "VariableDeclarator"));
      if (!this.eat(12)) break;
    }
    return node;
  }
  parseVarId(decl, kind) {
    const id = this.parseBindingAtom();
    if (kind === "using" || kind === "await using") {
      if (id.type === "ArrayPattern" || id.type === "ObjectPattern") {
        this.raise(Errors.UsingDeclarationHasBindingPattern, id.loc.start);
      }
    } else {
      if (id.type === "VoidPattern") {
        this.raise(Errors.UnexpectedVoidPattern, id.loc.start);
      }
    }
    this.checkLVal(id, {
      type: "VariableDeclarator"
    }, kind === "var" ? 5 : 8201);
    decl.id = id;
  }
  parseAsyncFunctionExpression(node) {
    return this.parseFunction(node, 8);
  }
  parseFunction(node, flags = 0) {
    const hangingDeclaration = flags & 2;
    const isDeclaration = !!(flags & 1);
    const requireId = isDeclaration && !(flags & 4);
    const isAsync = !!(flags & 8);
    this.initFunction(node, isAsync);
    if (this.match(55)) {
      if (hangingDeclaration) {
        this.raise(Errors.GeneratorInSingleStatementContext, this.state.startLoc);
      }
      this.next();
      node.generator = true;
    }
    if (isDeclaration) {
      node.id = this.parseFunctionId(requireId);
    }
    const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
    this.state.maybeInArrowParameters = false;
    this.scope.enter(514);
    this.prodParam.enter(functionFlags(isAsync, node.generator));
    if (!isDeclaration) {
      node.id = this.parseFunctionId();
    }
    this.parseFunctionParams(node, false);
    this.withSmartMixTopicForbiddingContext(() => {
      this.parseFunctionBodyAndFinish(node, isDeclaration ? "FunctionDeclaration" : "FunctionExpression");
    });
    this.prodParam.exit();
    this.scope.exit();
    if (isDeclaration && !hangingDeclaration) {
      this.registerFunctionStatementId(node);
    }
    this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
    return node;
  }
  parseFunctionId(requireId) {
    return requireId || tokenIsIdentifier(this.state.type) ? this.parseIdentifier() : null;
  }
  parseFunctionParams(node, isConstructor) {
    this.expect(10);
    this.expressionScope.enter(newParameterDeclarationScope());
    node.params = this.parseBindingList(11, 41, 2 | (isConstructor ? 4 : 0));
    this.expressionScope.exit();
  }
  registerFunctionStatementId(node) {
    if (!node.id) return;
    this.scope.declareName(node.id.name, !this.options.annexB || this.state.strict || node.generator || node.async ? this.scope.treatFunctionsAsVar ? 5 : 8201 : 17, node.id.loc.start);
  }
  parseClass(node, isStatement, optionalId) {
    this.next();
    const oldStrict = this.state.strict;
    this.state.strict = true;
    this.parseClassId(node, isStatement, optionalId);
    this.parseClassSuper(node);
    node.body = this.parseClassBody(!!node.superClass, oldStrict);
    return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
  }
  isClassProperty() {
    return this.match(29) || this.match(13) || this.match(8);
  }
  isClassMethod() {
    return this.match(10);
  }
  nameIsConstructor(key) {
    return key.type === "Identifier" && key.name === "constructor" || key.type === "StringLiteral" && key.value === "constructor";
  }
  isNonstaticConstructor(method) {
    return !method.computed && !method.static && this.nameIsConstructor(method.key);
  }
  parseClassBody(hadSuperClass, oldStrict) {
    this.classScope.enter();
    const state = {
      hadConstructor: false,
      hadSuperClass
    };
    let decorators = [];
    const classBody = this.startNode();
    classBody.body = [];
    this.expect(5);
    this.withSmartMixTopicForbiddingContext(() => {
      while (!this.match(8)) {
        if (this.eat(13)) {
          if (decorators.length > 0) {
            throw this.raise(Errors.DecoratorSemicolon, this.state.lastTokEndLoc);
          }
          continue;
        }
        if (this.match(26)) {
          decorators.push(this.parseDecorator());
          continue;
        }
        const member = this.startNode();
        if (decorators.length) {
          member.decorators = decorators;
          this.resetStartLocationFromNode(member, decorators[0]);
          decorators = [];
        }
        this.parseClassMember(classBody, member, state);
        if (member.kind === "constructor" && member.decorators && member.decorators.length > 0) {
          this.raise(Errors.DecoratorConstructor, member);
        }
      }
    });
    this.state.strict = oldStrict;
    this.next();
    if (decorators.length) {
      throw this.raise(Errors.TrailingDecorator, this.state.startLoc);
    }
    this.classScope.exit();
    return this.finishNode(classBody, "ClassBody");
  }
  parseClassMemberFromModifier(classBody, member) {
    const key = this.parseIdentifier(true);
    if (this.isClassMethod()) {
      const method = member;
      method.kind = "method";
      method.computed = false;
      method.key = key;
      method.static = false;
      this.pushClassMethod(classBody, method, false, false, false, false);
      return true;
    } else if (this.isClassProperty()) {
      const prop = member;
      prop.computed = false;
      prop.key = key;
      prop.static = false;
      classBody.body.push(this.parseClassProperty(prop));
      return true;
    }
    this.resetPreviousNodeTrailingComments(key);
    return false;
  }
  parseClassMember(classBody, member, state) {
    const isStatic = this.isContextual(106);
    if (isStatic) {
      if (this.parseClassMemberFromModifier(classBody, member)) {
        return;
      }
      if (this.eat(5)) {
        this.parseClassStaticBlock(classBody, member);
        return;
      }
    }
    this.parseClassMemberWithIsStatic(classBody, member, state, isStatic);
  }
  parseClassMemberWithIsStatic(classBody, member, state, isStatic) {
    const publicMethod = member;
    const privateMethod = member;
    const publicProp = member;
    const privateProp = member;
    const accessorProp = member;
    const method = publicMethod;
    const publicMember = publicMethod;
    member.static = isStatic;
    this.parsePropertyNamePrefixOperator(member);
    if (this.eat(55)) {
      method.kind = "method";
      const isPrivateName = this.match(139);
      this.parseClassElementName(method);
      this.parsePostMemberNameModifiers(method);
      if (isPrivateName) {
        this.pushClassPrivateMethod(classBody, privateMethod, true, false);
        return;
      }
      if (this.isNonstaticConstructor(publicMethod)) {
        this.raise(Errors.ConstructorIsGenerator, publicMethod.key);
      }
      this.pushClassMethod(classBody, publicMethod, true, false, false, false);
      return;
    }
    const isContextual = !this.state.containsEsc && tokenIsIdentifier(this.state.type);
    const key = this.parseClassElementName(member);
    const maybeContextualKw = isContextual ? key.name : null;
    const isPrivate = this.isPrivateName(key);
    const maybeQuestionTokenStartLoc = this.state.startLoc;
    this.parsePostMemberNameModifiers(publicMember);
    if (this.isClassMethod()) {
      method.kind = "method";
      if (isPrivate) {
        this.pushClassPrivateMethod(classBody, privateMethod, false, false);
        return;
      }
      const isConstructor = this.isNonstaticConstructor(publicMethod);
      let allowsDirectSuper = false;
      if (isConstructor) {
        publicMethod.kind = "constructor";
        if (state.hadConstructor && !this.hasPlugin("typescript")) {
          this.raise(Errors.DuplicateConstructor, key);
        }
        if (isConstructor && this.hasPlugin("typescript") && member.override) {
          this.raise(Errors.OverrideOnConstructor, key);
        }
        state.hadConstructor = true;
        allowsDirectSuper = state.hadSuperClass;
      }
      this.pushClassMethod(classBody, publicMethod, false, false, isConstructor, allowsDirectSuper);
    } else if (this.isClassProperty()) {
      if (isPrivate) {
        this.pushClassPrivateProperty(classBody, privateProp);
      } else {
        this.pushClassProperty(classBody, publicProp);
      }
    } else if (maybeContextualKw === "async" && !this.isLineTerminator()) {
      this.resetPreviousNodeTrailingComments(key);
      const isGenerator = this.eat(55);
      if (publicMember.optional) {
        this.unexpected(maybeQuestionTokenStartLoc);
      }
      method.kind = "method";
      const isPrivate = this.match(139);
      this.parseClassElementName(method);
      this.parsePostMemberNameModifiers(publicMember);
      if (isPrivate) {
        this.pushClassPrivateMethod(classBody, privateMethod, isGenerator, true);
      } else {
        if (this.isNonstaticConstructor(publicMethod)) {
          this.raise(Errors.ConstructorIsAsync, publicMethod.key);
        }
        this.pushClassMethod(classBody, publicMethod, isGenerator, true, false, false);
      }
    } else if ((maybeContextualKw === "get" || maybeContextualKw === "set") && !(this.match(55) && this.isLineTerminator())) {
      this.resetPreviousNodeTrailingComments(key);
      method.kind = maybeContextualKw;
      const isPrivate = this.match(139);
      this.parseClassElementName(publicMethod);
      if (isPrivate) {
        this.pushClassPrivateMethod(classBody, privateMethod, false, false);
      } else {
        if (this.isNonstaticConstructor(publicMethod)) {
          this.raise(Errors.ConstructorIsAccessor, publicMethod.key);
        }
        this.pushClassMethod(classBody, publicMethod, false, false, false, false);
      }
      this.checkGetterSetterParams(publicMethod);
    } else if (maybeContextualKw === "accessor" && !this.isLineTerminator()) {
      this.expectPlugin("decoratorAutoAccessors");
      this.resetPreviousNodeTrailingComments(key);
      const isPrivate = this.match(139);
      this.parseClassElementName(publicProp);
      this.pushClassAccessorProperty(classBody, accessorProp, isPrivate);
    } else if (this.isLineTerminator()) {
      if (isPrivate) {
        this.pushClassPrivateProperty(classBody, privateProp);
      } else {
        this.pushClassProperty(classBody, publicProp);
      }
    } else {
      this.unexpected();
    }
  }
  parseClassElementName(member) {
    const {
      type,
      value
    } = this.state;
    if ((type === 132 || type === 134) && member.static && value === "prototype") {
      this.raise(Errors.StaticPrototype, this.state.startLoc);
    }
    if (type === 139) {
      if (value === "constructor") {
        this.raise(Errors.ConstructorClassPrivateField, this.state.startLoc);
      }
      const key = this.parsePrivateName();
      member.key = key;
      return key;
    }
    this.parsePropertyName(member);
    return member.key;
  }
  parseClassStaticBlock(classBody, member) {
    var _member$decorators;
    this.scope.enter(576 | 128 | 16);
    const oldLabels = this.state.labels;
    this.state.labels = [];
    this.prodParam.enter(0);
    const body = member.body = [];
    this.parseBlockOrModuleBlockBody(body, undefined, false, 8);
    this.prodParam.exit();
    this.scope.exit();
    this.state.labels = oldLabels;
    classBody.body.push(this.finishNode(member, "StaticBlock"));
    if ((_member$decorators = member.decorators) != null && _member$decorators.length) {
      this.raise(Errors.DecoratorStaticBlock, member);
    }
  }
  pushClassProperty(classBody, prop) {
    if (!prop.computed && this.nameIsConstructor(prop.key)) {
      this.raise(Errors.ConstructorClassField, prop.key);
    }
    classBody.body.push(this.parseClassProperty(prop));
  }
  pushClassPrivateProperty(classBody, prop) {
    const node = this.parseClassPrivateProperty(prop);
    classBody.body.push(node);
    this.classScope.declarePrivateName(this.getPrivateNameSV(node.key), 0, node.key.loc.start);
  }
  pushClassAccessorProperty(classBody, prop, isPrivate) {
    if (!isPrivate && !prop.computed && this.nameIsConstructor(prop.key)) {
      this.raise(Errors.ConstructorClassField, prop.key);
    }
    const node = this.parseClassAccessorProperty(prop);
    classBody.body.push(node);
    if (isPrivate) {
      this.classScope.declarePrivateName(this.getPrivateNameSV(node.key), 0, node.key.loc.start);
    }
  }
  pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper) {
    classBody.body.push(this.parseMethod(method, isGenerator, isAsync, isConstructor, allowsDirectSuper, "ClassMethod", true));
  }
  pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
    const node = this.parseMethod(method, isGenerator, isAsync, false, false, "ClassPrivateMethod", true);
    classBody.body.push(node);
    const kind = node.kind === "get" ? node.static ? 6 : 2 : node.kind === "set" ? node.static ? 5 : 1 : 0;
    this.declareClassPrivateMethodInScope(node, kind);
  }
  declareClassPrivateMethodInScope(node, kind) {
    this.classScope.declarePrivateName(this.getPrivateNameSV(node.key), kind, node.key.loc.start);
  }
  parsePostMemberNameModifiers(methodOrProp) {}
  parseClassPrivateProperty(node) {
    this.parseInitializer(node);
    this.semicolon();
    return this.finishNode(node, "ClassPrivateProperty");
  }
  parseClassProperty(node) {
    this.parseInitializer(node);
    this.semicolon();
    return this.finishNode(node, "ClassProperty");
  }
  parseClassAccessorProperty(node) {
    this.parseInitializer(node);
    this.semicolon();
    return this.finishNode(node, "ClassAccessorProperty");
  }
  parseInitializer(node) {
    this.scope.enter(576 | 16);
    this.expressionScope.enter(newExpressionScope());
    this.prodParam.enter(0);
    node.value = this.eat(29) ? this.parseMaybeAssignAllowIn() : null;
    this.expressionScope.exit();
    this.prodParam.exit();
    this.scope.exit();
  }
  parseClassId(node, isStatement, optionalId, bindingType = 8331) {
    if (tokenIsIdentifier(this.state.type)) {
      node.id = this.parseIdentifier();
      if (isStatement) {
        this.declareNameFromIdentifier(node.id, bindingType);
      }
    } else {
      if (optionalId || !isStatement) {
        node.id = null;
      } else {
        throw this.raise(Errors.MissingClassName, this.state.startLoc);
      }
    }
  }
  parseClassSuper(node) {
    node.superClass = this.eat(81) ? this.parseExprSubscripts() : null;
  }
  parseExport(node, decorators) {
    const maybeDefaultIdentifier = this.parseMaybeImportPhase(node, true);
    const hasDefault = this.maybeParseExportDefaultSpecifier(node, maybeDefaultIdentifier);
    const parseAfterDefault = !hasDefault || this.eat(12);
    const hasStar = parseAfterDefault && this.eatExportStar(node);
    const hasNamespace = hasStar && this.maybeParseExportNamespaceSpecifier(node);
    const parseAfterNamespace = parseAfterDefault && (!hasNamespace || this.eat(12));
    const isFromRequired = hasDefault || hasStar;
    if (hasStar && !hasNamespace) {
      if (hasDefault) this.unexpected();
      if (decorators) {
        throw this.raise(Errors.UnsupportedDecoratorExport, node);
      }
      this.parseExportFrom(node, true);
      this.sawUnambiguousESM = true;
      return this.finishNode(node, "ExportAllDeclaration");
    }
    const hasSpecifiers = this.maybeParseExportNamedSpecifiers(node);
    if (hasDefault && parseAfterDefault && !hasStar && !hasSpecifiers) {
      this.unexpected(null, 5);
    }
    if (hasNamespace && parseAfterNamespace) {
      this.unexpected(null, 98);
    }
    let hasDeclaration;
    if (isFromRequired || hasSpecifiers) {
      hasDeclaration = false;
      if (decorators) {
        throw this.raise(Errors.UnsupportedDecoratorExport, node);
      }
      this.parseExportFrom(node, isFromRequired);
    } else {
      hasDeclaration = this.maybeParseExportDeclaration(node);
    }
    if (isFromRequired || hasSpecifiers || hasDeclaration) {
      var _node2$declaration;
      const node2 = node;
      this.checkExport(node2, true, false, !!node2.source);
      if (((_node2$declaration = node2.declaration) == null ? void 0 : _node2$declaration.type) === "ClassDeclaration") {
        this.maybeTakeDecorators(decorators, node2.declaration, node2);
      } else if (decorators) {
        throw this.raise(Errors.UnsupportedDecoratorExport, node);
      }
      this.sawUnambiguousESM = true;
      return this.finishNode(node2, "ExportNamedDeclaration");
    }
    if (this.eat(65)) {
      const node2 = node;
      const decl = this.parseExportDefaultExpression();
      node2.declaration = decl;
      if (decl.type === "ClassDeclaration") {
        this.maybeTakeDecorators(decorators, decl, node2);
      } else if (decorators) {
        throw this.raise(Errors.UnsupportedDecoratorExport, node);
      }
      this.checkExport(node2, true, true);
      this.sawUnambiguousESM = true;
      return this.finishNode(node2, "ExportDefaultDeclaration");
    }
    throw this.unexpected(null, 5);
  }
  eatExportStar(node) {
    return this.eat(55);
  }
  maybeParseExportDefaultSpecifier(node, maybeDefaultIdentifier) {
    if (maybeDefaultIdentifier || this.isExportDefaultSpecifier()) {
      this.expectPlugin("exportDefaultFrom", maybeDefaultIdentifier == null ? void 0 : maybeDefaultIdentifier.loc.start);
      const id = maybeDefaultIdentifier || this.parseIdentifier(true);
      const specifier = this.startNodeAtNode(id);
      specifier.exported = id;
      node.specifiers = [this.finishNode(specifier, "ExportDefaultSpecifier")];
      return true;
    }
    return false;
  }
  maybeParseExportNamespaceSpecifier(node) {
    if (this.isContextual(93)) {
      var _ref, _ref$specifiers;
      (_ref$specifiers = (_ref = node).specifiers) != null ? _ref$specifiers : _ref.specifiers = [];
      const specifier = this.startNodeAt(this.state.lastTokStartLoc);
      this.next();
      specifier.exported = this.parseModuleExportName();
      node.specifiers.push(this.finishNode(specifier, "ExportNamespaceSpecifier"));
      return true;
    }
    return false;
  }
  maybeParseExportNamedSpecifiers(node) {
    if (this.match(5)) {
      const node2 = node;
      if (!node2.specifiers) node2.specifiers = [];
      const isTypeExport = node2.exportKind === "type";
      node2.specifiers.push(...this.parseExportSpecifiers(isTypeExport));
      node2.source = null;
      if (this.hasPlugin("importAssertions")) {
        node2.assertions = [];
      } else {
        node2.attributes = [];
      }
      node2.declaration = null;
      return true;
    }
    return false;
  }
  maybeParseExportDeclaration(node) {
    if (this.shouldParseExportDeclaration()) {
      node.specifiers = [];
      node.source = null;
      if (this.hasPlugin("importAssertions")) {
        node.assertions = [];
      } else {
        node.attributes = [];
      }
      node.declaration = this.parseExportDeclaration(node);
      return true;
    }
    return false;
  }
  isAsyncFunction() {
    if (!this.isContextual(95)) return false;
    const next = this.nextTokenInLineStart();
    return this.isUnparsedContextual(next, "function");
  }
  parseExportDefaultExpression() {
    const expr = this.startNode();
    if (this.match(68)) {
      this.next();
      return this.parseFunction(expr, 1 | 4);
    } else if (this.isAsyncFunction()) {
      this.next();
      this.next();
      return this.parseFunction(expr, 1 | 4 | 8);
    }
    if (this.match(80)) {
      return this.parseClass(expr, true, true);
    }
    if (this.match(26)) {
      if (this.hasPlugin("decorators") && this.getPluginOption("decorators", "decoratorsBeforeExport") === true) {
        this.raise(Errors.DecoratorBeforeExport, this.state.startLoc);
      }
      return this.parseClass(this.maybeTakeDecorators(this.parseDecorators(false), this.startNode()), true, true);
    }
    if (this.match(75) || this.match(74) || this.isLet() || this.isUsing() || this.isAwaitUsing()) {
      throw this.raise(Errors.UnsupportedDefaultExport, this.state.startLoc);
    }
    const res = this.parseMaybeAssignAllowIn();
    this.semicolon();
    return res;
  }
  parseExportDeclaration(node) {
    if (this.match(80)) {
      const node = this.parseClass(this.startNode(), true, false);
      return node;
    }
    return this.parseStatementListItem();
  }
  isExportDefaultSpecifier() {
    const {
      type
    } = this.state;
    if (tokenIsIdentifier(type)) {
      if (type === 95 && !this.state.containsEsc || type === 100) {
        return false;
      }
      if ((type === 130 || type === 129) && !this.state.containsEsc) {
        const next = this.nextTokenStart();
        const nextChar = this.input.charCodeAt(next);
        if (nextChar === 123 || this.chStartsBindingIdentifier(nextChar, next) && !this.input.startsWith("from", next)) {
          this.expectOnePlugin(["flow", "typescript"]);
          return false;
        }
      }
    } else if (!this.match(65)) {
      return false;
    }
    const next = this.nextTokenStart();
    const hasFrom = this.isUnparsedContextual(next, "from");
    if (this.input.charCodeAt(next) === 44 || tokenIsIdentifier(this.state.type) && hasFrom) {
      return true;
    }
    if (this.match(65) && hasFrom) {
      const nextAfterFrom = this.input.charCodeAt(this.nextTokenStartSince(next + 4));
      return nextAfterFrom === 34 || nextAfterFrom === 39;
    }
    return false;
  }
  parseExportFrom(node, expect) {
    if (this.eatContextual(98)) {
      node.source = this.parseImportSource();
      this.checkExport(node);
      this.maybeParseImportAttributes(node);
      this.checkJSONModuleImport(node);
    } else if (expect) {
      this.unexpected();
    }
    this.semicolon();
  }
  shouldParseExportDeclaration() {
    const {
      type
    } = this.state;
    if (type === 26) {
      this.expectOnePlugin(["decorators", "decorators-legacy"]);
      if (this.hasPlugin("decorators")) {
        if (this.getPluginOption("decorators", "decoratorsBeforeExport") === true) {
          this.raise(Errors.DecoratorBeforeExport, this.state.startLoc);
        }
        return true;
      }
    }
    if (this.isUsing()) {
      this.raise(Errors.UsingDeclarationExport, this.state.startLoc);
      return true;
    }
    if (this.isAwaitUsing()) {
      this.raise(Errors.UsingDeclarationExport, this.state.startLoc);
      return true;
    }
    return type === 74 || type === 75 || type === 68 || type === 80 || this.isLet() || this.isAsyncFunction();
  }
  checkExport(node, checkNames, isDefault, isFrom) {
    if (checkNames) {
      var _node$specifiers;
      if (isDefault) {
        this.checkDuplicateExports(node, "default");
        if (this.hasPlugin("exportDefaultFrom")) {
          var _declaration$extra;
          const declaration = node.declaration;
          if (declaration.type === "Identifier" && declaration.name === "from" && declaration.end - declaration.start === 4 && !((_declaration$extra = declaration.extra) != null && _declaration$extra.parenthesized)) {
            this.raise(Errors.ExportDefaultFromAsIdentifier, declaration);
          }
        }
      } else if ((_node$specifiers = node.specifiers) != null && _node$specifiers.length) {
        for (const specifier of node.specifiers) {
          const {
            exported
          } = specifier;
          const exportName = exported.type === "Identifier" ? exported.name : exported.value;
          this.checkDuplicateExports(specifier, exportName);
          if (!isFrom && specifier.local) {
            const {
              local
            } = specifier;
            if (local.type !== "Identifier") {
              this.raise(Errors.ExportBindingIsString, specifier, {
                localName: local.value,
                exportName
              });
            } else {
              this.checkReservedWord(local.name, local.loc.start, true, false);
              this.scope.checkLocalExport(local);
            }
          }
        }
      } else if (node.declaration) {
        const decl = node.declaration;
        if (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") {
          const {
            id
          } = decl;
          if (!id) throw new Error("Assertion failure");
          this.checkDuplicateExports(node, id.name);
        } else if (decl.type === "VariableDeclaration") {
          for (const declaration of decl.declarations) {
            this.checkDeclaration(declaration.id);
          }
        }
      }
    }
  }
  checkDeclaration(node) {
    if (node.type === "Identifier") {
      this.checkDuplicateExports(node, node.name);
    } else if (node.type === "ObjectPattern") {
      for (const prop of node.properties) {
        this.checkDeclaration(prop);
      }
    } else if (node.type === "ArrayPattern") {
      for (const elem of node.elements) {
        if (elem) {
          this.checkDeclaration(elem);
        }
      }
    } else if (node.type === "ObjectProperty") {
      this.checkDeclaration(node.value);
    } else if (node.type === "RestElement") {
      this.checkDeclaration(node.argument);
    } else if (node.type === "AssignmentPattern") {
      this.checkDeclaration(node.left);
    }
  }
  checkDuplicateExports(node, exportName) {
    if (this.exportedIdentifiers.has(exportName)) {
      if (exportName === "default") {
        this.raise(Errors.DuplicateDefaultExport, node);
      } else {
        this.raise(Errors.DuplicateExport, node, {
          exportName
        });
      }
    }
    this.exportedIdentifiers.add(exportName);
  }
  parseExportSpecifiers(isInTypeExport) {
    const nodes = [];
    let first = true;
    this.expect(5);
    while (!this.eat(8)) {
      if (first) {
        first = false;
      } else {
        this.expect(12);
        if (this.eat(8)) break;
      }
      const isMaybeTypeOnly = this.isContextual(130);
      const isString = this.match(134);
      const node = this.startNode();
      node.local = this.parseModuleExportName();
      nodes.push(this.parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly));
    }
    return nodes;
  }
  parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly) {
    if (this.eatContextual(93)) {
      node.exported = this.parseModuleExportName();
    } else if (isString) {
      node.exported = this.cloneStringLiteral(node.local);
    } else if (!node.exported) {
      node.exported = this.cloneIdentifier(node.local);
    }
    return this.finishNode(node, "ExportSpecifier");
  }
  parseModuleExportName() {
    if (this.match(134)) {
      const result = this.parseStringLiteral(this.state.value);
      const surrogate = loneSurrogate.exec(result.value);
      if (surrogate) {
        this.raise(Errors.ModuleExportNameHasLoneSurrogate, result, {
          surrogateCharCode: surrogate[0].charCodeAt(0)
        });
      }
      return result;
    }
    return this.parseIdentifier(true);
  }
  isJSONModuleImport(node) {
    if (node.assertions != null) {
      return node.assertions.some(({
        key,
        value
      }) => {
        return value.value === "json" && (key.type === "Identifier" ? key.name === "type" : key.value === "type");
      });
    }
    return false;
  }
  checkImportReflection(node) {
    const {
      specifiers
    } = node;
    const singleBindingType = specifiers.length === 1 ? specifiers[0].type : null;
    if (node.phase === "source") {
      if (singleBindingType !== "ImportDefaultSpecifier") {
        this.raise(Errors.SourcePhaseImportRequiresDefault, specifiers[0].loc.start);
      }
    } else if (node.phase === "defer") {
      if (singleBindingType !== "ImportNamespaceSpecifier") {
        this.raise(Errors.DeferImportRequiresNamespace, specifiers[0].loc.start);
      }
    } else if (node.module) {
      var _node$assertions;
      if (singleBindingType !== "ImportDefaultSpecifier") {
        this.raise(Errors.ImportReflectionNotBinding, specifiers[0].loc.start);
      }
      if (((_node$assertions = node.assertions) == null ? void 0 : _node$assertions.length) > 0) {
        this.raise(Errors.ImportReflectionHasAssertion, specifiers[0].loc.start);
      }
    }
  }
  checkJSONModuleImport(node) {
    if (this.isJSONModuleImport(node) && node.type !== "ExportAllDeclaration") {
      const {
        specifiers
      } = node;
      if (specifiers != null) {
        const nonDefaultNamedSpecifier = specifiers.find(specifier => {
          let imported;
          if (specifier.type === "ExportSpecifier") {
            imported = specifier.local;
          } else if (specifier.type === "ImportSpecifier") {
            imported = specifier.imported;
          }
          if (imported !== undefined) {
            return imported.type === "Identifier" ? imported.name !== "default" : imported.value !== "default";
          }
        });
        if (nonDefaultNamedSpecifier !== undefined) {
          this.raise(Errors.ImportJSONBindingNotDefault, nonDefaultNamedSpecifier.loc.start);
        }
      }
    }
  }
  isPotentialImportPhase(isExport) {
    if (isExport) return false;
    return this.isContextual(105) || this.isContextual(97) || this.isContextual(127);
  }
  applyImportPhase(node, isExport, phase, loc) {
    if (isExport) {
      return;
    }
    if (phase === "module") {
      this.expectPlugin("importReflection", loc);
      node.module = true;
    } else if (this.hasPlugin("importReflection")) {
      node.module = false;
    }
    if (phase === "source") {
      this.expectPlugin("sourcePhaseImports", loc);
      node.phase = "source";
    } else if (phase === "defer") {
      this.expectPlugin("deferredImportEvaluation", loc);
      node.phase = "defer";
    } else if (this.hasPlugin("sourcePhaseImports")) {
      node.phase = null;
    }
  }
  parseMaybeImportPhase(node, isExport) {
    if (!this.isPotentialImportPhase(isExport)) {
      this.applyImportPhase(node, isExport, null);
      return null;
    }
    const phaseIdentifier = this.startNode();
    const phaseIdentifierName = this.parseIdentifierName(true);
    const {
      type
    } = this.state;
    const isImportPhase = tokenIsKeywordOrIdentifier(type) ? type !== 98 || this.lookaheadCharCode() === 102 : type !== 12;
    if (isImportPhase) {
      this.applyImportPhase(node, isExport, phaseIdentifierName, phaseIdentifier.loc.start);
      return null;
    } else {
      this.applyImportPhase(node, isExport, null);
      return this.createIdentifier(phaseIdentifier, phaseIdentifierName);
    }
  }
  isPrecedingIdImportPhase(phase) {
    const {
      type
    } = this.state;
    return tokenIsIdentifier(type) ? type !== 98 || this.lookaheadCharCode() === 102 : type !== 12;
  }
  parseImport(node) {
    if (this.match(134)) {
      return this.parseImportSourceAndAttributes(node);
    }
    return this.parseImportSpecifiersAndAfter(node, this.parseMaybeImportPhase(node, false));
  }
  parseImportSpecifiersAndAfter(node, maybeDefaultIdentifier) {
    node.specifiers = [];
    const hasDefault = this.maybeParseDefaultImportSpecifier(node, maybeDefaultIdentifier);
    const parseNext = !hasDefault || this.eat(12);
    const hasStar = parseNext && this.maybeParseStarImportSpecifier(node);
    if (parseNext && !hasStar) this.parseNamedImportSpecifiers(node);
    this.expectContextual(98);
    return this.parseImportSourceAndAttributes(node);
  }
  parseImportSourceAndAttributes(node) {
    var _node$specifiers2;
    (_node$specifiers2 = node.specifiers) != null ? _node$specifiers2 : node.specifiers = [];
    node.source = this.parseImportSource();
    this.maybeParseImportAttributes(node);
    this.checkImportReflection(node);
    this.checkJSONModuleImport(node);
    this.semicolon();
    this.sawUnambiguousESM = true;
    return this.finishNode(node, "ImportDeclaration");
  }
  parseImportSource() {
    if (!this.match(134)) this.unexpected();
    return this.parseExprAtom();
  }
  parseImportSpecifierLocal(node, specifier, type) {
    specifier.local = this.parseIdentifier();
    node.specifiers.push(this.finishImportSpecifier(specifier, type));
  }
  finishImportSpecifier(specifier, type, bindingType = 8201) {
    this.checkLVal(specifier.local, {
      type
    }, bindingType);
    return this.finishNode(specifier, type);
  }
  parseImportAttributes() {
    this.expect(5);
    const attrs = [];
    const attrNames = new Set();
    do {
      if (this.match(8)) {
        break;
      }
      const node = this.startNode();
      const keyName = this.state.value;
      if (attrNames.has(keyName)) {
        this.raise(Errors.ModuleAttributesWithDuplicateKeys, this.state.startLoc, {
          key: keyName
        });
      }
      attrNames.add(keyName);
      if (this.match(134)) {
        node.key = this.parseStringLiteral(keyName);
      } else {
        node.key = this.parseIdentifier(true);
      }
      this.expect(14);
      if (!this.match(134)) {
        throw this.raise(Errors.ModuleAttributeInvalidValue, this.state.startLoc);
      }
      node.value = this.parseStringLiteral(this.state.value);
      attrs.push(this.finishNode(node, "ImportAttribute"));
    } while (this.eat(12));
    this.expect(8);
    return attrs;
  }
  parseModuleAttributes() {
    const attrs = [];
    const attributes = new Set();
    do {
      const node = this.startNode();
      node.key = this.parseIdentifier(true);
      if (node.key.name !== "type") {
        this.raise(Errors.ModuleAttributeDifferentFromType, node.key);
      }
      if (attributes.has(node.key.name)) {
        this.raise(Errors.ModuleAttributesWithDuplicateKeys, node.key, {
          key: node.key.name
        });
      }
      attributes.add(node.key.name);
      this.expect(14);
      if (!this.match(134)) {
        throw this.raise(Errors.ModuleAttributeInvalidValue, this.state.startLoc);
      }
      node.value = this.parseStringLiteral(this.state.value);
      attrs.push(this.finishNode(node, "ImportAttribute"));
    } while (this.eat(12));
    return attrs;
  }
  maybeParseImportAttributes(node) {
    let attributes;
    var useWith = false;
    if (this.match(76)) {
      if (this.hasPrecedingLineBreak() && this.lookaheadCharCode() === 40) {
        return;
      }
      this.next();
      if (this.hasPlugin("moduleAttributes")) {
        attributes = this.parseModuleAttributes();
        this.addExtra(node, "deprecatedWithLegacySyntax", true);
      } else {
        attributes = this.parseImportAttributes();
      }
      useWith = true;
    } else if (this.isContextual(94) && !this.hasPrecedingLineBreak()) {
      if (!this.hasPlugin("deprecatedImportAssert") && !this.hasPlugin("importAssertions")) {
        this.raise(Errors.ImportAttributesUseAssert, this.state.startLoc);
      }
      if (!this.hasPlugin("importAssertions")) {
        this.addExtra(node, "deprecatedAssertSyntax", true);
      }
      this.next();
      attributes = this.parseImportAttributes();
    } else {
      attributes = [];
    }
    if (!useWith && this.hasPlugin("importAssertions")) {
      node.assertions = attributes;
    } else {
      node.attributes = attributes;
    }
  }
  maybeParseDefaultImportSpecifier(node, maybeDefaultIdentifier) {
    if (maybeDefaultIdentifier) {
      const specifier = this.startNodeAtNode(maybeDefaultIdentifier);
      specifier.local = maybeDefaultIdentifier;
      node.specifiers.push(this.finishImportSpecifier(specifier, "ImportDefaultSpecifier"));
      return true;
    } else if (tokenIsKeywordOrIdentifier(this.state.type)) {
      this.parseImportSpecifierLocal(node, this.startNode(), "ImportDefaultSpecifier");
      return true;
    }
    return false;
  }
  maybeParseStarImportSpecifier(node) {
    if (this.match(55)) {
      const specifier = this.startNode();
      this.next();
      this.expectContextual(93);
      this.parseImportSpecifierLocal(node, specifier, "ImportNamespaceSpecifier");
      return true;
    }
    return false;
  }
  parseNamedImportSpecifiers(node) {
    let first = true;
    this.expect(5);
    while (!this.eat(8)) {
      if (first) {
        first = false;
      } else {
        if (this.eat(14)) {
          throw this.raise(Errors.DestructureNamedImport, this.state.startLoc);
        }
        this.expect(12);
        if (this.eat(8)) break;
      }
      const specifier = this.startNode();
      const importedIsString = this.match(134);
      const isMaybeTypeOnly = this.isContextual(130);
      specifier.imported = this.parseModuleExportName();
      const importSpecifier = this.parseImportSpecifier(specifier, importedIsString, node.importKind === "type" || node.importKind === "typeof", isMaybeTypeOnly, undefined);
      node.specifiers.push(importSpecifier);
    }
  }
  parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, bindingType) {
    if (this.eatContextual(93)) {
      specifier.local = this.parseIdentifier();
    } else {
      const {
        imported
      } = specifier;
      if (importedIsString) {
        throw this.raise(Errors.ImportBindingIsString, specifier, {
          importName: imported.value
        });
      }
      this.checkReservedWord(imported.name, specifier.loc.start, true, true);
      if (!specifier.local) {
        specifier.local = this.cloneIdentifier(imported);
      }
    }
    return this.finishImportSpecifier(specifier, "ImportSpecifier", bindingType);
  }
  isThisParam(param) {
    return param.type === "Identifier" && param.name === "this";
  }
}
class Parser extends StatementParser {
  constructor(options, input, pluginsMap) {
    const normalizedOptions = getOptions(options);
    super(normalizedOptions, input);
    this.options = normalizedOptions;
    this.initializeScopes();
    this.plugins = pluginsMap;
    this.filename = normalizedOptions.sourceFilename;
    this.startIndex = normalizedOptions.startIndex;
    let optionFlags = 0;
    if (normalizedOptions.allowAwaitOutsideFunction) {
      optionFlags |= 1;
    }
    if (normalizedOptions.allowReturnOutsideFunction) {
      optionFlags |= 2;
    }
    if (normalizedOptions.allowImportExportEverywhere) {
      optionFlags |= 8;
    }
    if (normalizedOptions.allowSuperOutsideMethod) {
      optionFlags |= 16;
    }
    if (normalizedOptions.allowUndeclaredExports) {
      optionFlags |= 64;
    }
    if (normalizedOptions.allowNewTargetOutsideFunction) {
      optionFlags |= 4;
    }
    if (normalizedOptions.allowYieldOutsideFunction) {
      optionFlags |= 32;
    }
    if (normalizedOptions.ranges) {
      optionFlags |= 128;
    }
    if (normalizedOptions.tokens) {
      optionFlags |= 256;
    }
    if (normalizedOptions.createImportExpressions) {
      optionFlags |= 512;
    }
    if (normalizedOptions.createParenthesizedExpressions) {
      optionFlags |= 1024;
    }
    if (normalizedOptions.errorRecovery) {
      optionFlags |= 2048;
    }
    if (normalizedOptions.attachComment) {
      optionFlags |= 4096;
    }
    if (normalizedOptions.annexB) {
      optionFlags |= 8192;
    }
    this.optionFlags = optionFlags;
  }
  getScopeHandler() {
    return ScopeHandler;
  }
  parse() {
    this.enterInitialScopes();
    const file = this.startNode();
    const program = this.startNode();
    this.nextToken();
    file.errors = null;
    const result = this.parseTopLevel(file, program);
    result.errors = this.state.errors;
    result.comments.length = this.state.commentsLen;
    return result;
  }
}
function parse(input, options) {
  var _options;
  if (((_options = options) == null ? void 0 : _options.sourceType) === "unambiguous") {
    options = Object.assign({}, options);
    try {
      options.sourceType = "module";
      const parser = getParser(options, input);
      const ast = parser.parse();
      if (parser.sawUnambiguousESM) {
        return ast;
      }
      if (parser.ambiguousScriptDifferentAst) {
        try {
          options.sourceType = "script";
          return getParser(options, input).parse();
        } catch (_unused) {}
      } else {
        ast.program.sourceType = "script";
      }
      return ast;
    } catch (moduleError) {
      try {
        options.sourceType = "script";
        return getParser(options, input).parse();
      } catch (_unused2) {}
      throw moduleError;
    }
  } else {
    return getParser(options, input).parse();
  }
}
function parseExpression(input, options) {
  const parser = getParser(options, input);
  if (parser.options.strictMode) {
    parser.state.strict = true;
  }
  return parser.getExpression();
}
function generateExportedTokenTypes(internalTokenTypes) {
  const tokenTypes = {};
  for (const typeName of Object.keys(internalTokenTypes)) {
    tokenTypes[typeName] = getExportedToken(internalTokenTypes[typeName]);
  }
  return tokenTypes;
}
const tokTypes = generateExportedTokenTypes(tt);
function getParser(options, input) {
  let cls = Parser;
  const pluginsMap = new Map();
  if (options != null && options.plugins) {
    for (const plugin of options.plugins) {
      let name, opts;
      if (typeof plugin === "string") {
        name = plugin;
      } else {
        [name, opts] = plugin;
      }
      if (!pluginsMap.has(name)) {
        pluginsMap.set(name, opts || {});
      }
    }
    validatePlugins(pluginsMap);
    cls = getParserClass(pluginsMap);
  }
  return new cls(options, input, pluginsMap);
}
const parserClassCache = new Map();
function getParserClass(pluginsMap) {
  const pluginList = [];
  for (const name of mixinPluginNames) {
    if (pluginsMap.has(name)) {
      pluginList.push(name);
    }
  }
  const key = pluginList.join("|");
  let cls = parserClassCache.get(key);
  if (!cls) {
    cls = Parser;
    for (const plugin of pluginList) {
      cls = mixinPlugins[plugin](cls);
    }
    parserClassCache.set(key, cls);
  }
  return cls;
}
exports.qg = parse;
__webpack_unused_export__ = parseExpression;
__webpack_unused_export__ = tokTypes;
//# sourceMappingURL=index.js.map


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/
/************************************************************************/
/******/ /* webpack/runtime/compat */
/******/
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/
/************************************************************************/
var __webpack_exports__ = {};

;// CONCATENATED MODULE: external "node:fs/promises"
const promises_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:fs/promises");
;// CONCATENATED MODULE: external "node:path"
const external_node_path_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:path");
;// CONCATENATED MODULE: external "node:crypto"
const external_node_crypto_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:crypto");
;// CONCATENATED MODULE: external "node:child_process"
const external_node_child_process_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:child_process");
;// CONCATENATED MODULE: external "node:os"
const external_node_os_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:os");
;// CONCATENATED MODULE: external "node:util"
const external_node_util_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:util");
;// CONCATENATED MODULE: ./src/lib/utils.js



function utils_normalizeString(value) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function toPosixPath(value) {
  return utils_normalizeString(value).replace(/\\/g, '/');
}

async function fileExists(filePath) {
  try {
    const stat = await promises_namespaceObject.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

function isWithinPath(rootDir, targetPath) {
  const relative = external_node_path_namespaceObject.relative(rootDir, targetPath);
  return relative !== '..' && !relative.startsWith(`..${external_node_path_namespaceObject.sep}`) && !external_node_path_namespaceObject.isAbsolute(relative);
}

function extensionCandidates(relativePath) {
  const normalized = toPosixPath(relativePath).replace(/^\/+/, '');
  if (!normalized) return [];
  const ext = external_node_path_namespaceObject.posix.extname(normalized).toLowerCase();
  if (ext) return [normalized];
  return [
    normalized,
    `${normalized}.js`,
    `${normalized}.jsx`,
    `${normalized}.mjs`,
    external_node_path_namespaceObject.posix.join(normalized, 'index.js'),
    external_node_path_namespaceObject.posix.join(normalized, 'index.jsx'),
    external_node_path_namespaceObject.posix.join(normalized, 'index.mjs'),
  ];
}

function compareLocale(a, b) {
  const left = String(a);
  const right = String(b);
  if (left === right) return 0;
  const leftPoints = Array.from(left);
  const rightPoints = Array.from(right);
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    const leftCodePoint = leftPoints[index].codePointAt(0);
    const rightCodePoint = rightPoints[index].codePointAt(0);
    if (leftCodePoint !== rightCodePoint) return leftCodePoint - rightCodePoint;
  }
  return leftPoints.length - rightPoints.length;
}

;// CONCATENATED MODULE: ./src/lib/diff-review.js


const SEVERITY_ORDER = new Map([
  ['error', 0],
  ['warning', 1],
  ['note', 2],
]);

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

function assertSafeFindingId(id, label, code) {
  if (CONTROL_CHARACTER_PATTERN.test(id)) {
    reviewError(`${label} must be a valid IronGlancer finding id.`, code);
  }
}

class DiffReviewError extends Error {
  constructor(message, code = 'diff_review_error') {
    super(message);
    this.name = 'DiffReviewError';
    this.code = code;
  }
}

function reviewError(message, code = 'invalid_review_input') {
  throw new DiffReviewError(message, code);
}

function assertPlainObject(value, label, code = 'invalid_review_input') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    reviewError(`${label} must be a JSON object.`, code);
  }
}

function assertExactKeys(value, expectedKeys, label, code) {
  const actualKeys = Object.keys(value).sort(compareLocale);
  const expected = [...expectedKeys].sort(compareLocale);
  if (
    actualKeys.length !== expected.length
    || actualKeys.some((key, index) => key !== expected[index])
  ) {
    reviewError(`${label} must contain only ${expectedKeys.join(' and ')}.`, code);
  }
}

function validateBaselineReport(baseline) {
  assertPlainObject(baseline, 'Baseline report', 'invalid_baseline');
  if (!Array.isArray(baseline.findings)) {
    reviewError('Baseline report must include a top-level findings array.', 'invalid_baseline');
  }
  const seen = new Set();
  for (const finding of baseline.findings) {
    if (!finding || typeof finding !== 'object' || Array.isArray(finding)) {
      reviewError('Baseline report findings must be JSON objects.', 'invalid_baseline');
    }
    const id = finding.id;
    if (typeof id !== 'string' || id.trim() === '') {
      reviewError('Baseline report findings must each include a nonempty string id.', 'invalid_baseline');
    }
    assertSafeFindingId(id, 'Baseline report finding id', 'invalid_baseline');
    if (seen.has(id)) {
      reviewError(`Baseline report contains duplicate finding id "${id}".`, 'invalid_baseline');
    }
    seen.add(id);
  }
  return {
    findingIds: seen,
    findingCount: baseline.findings.length,
  };
}

function validateSuppressionsConfig(config) {
  assertPlainObject(config, 'Suppressions file', 'invalid_suppressions');
  if (config.version !== 1) {
    reviewError('Suppressions file must use version 1.', 'invalid_suppressions');
  }
  if (!Array.isArray(config.suppressions)) {
    reviewError('Suppressions file must include a suppressions array.', 'invalid_suppressions');
  }
  assertExactKeys(config, ['version', 'suppressions'], 'Suppressions file', 'invalid_suppressions');

  const seen = new Set();
  const suppressions = config.suppressions.map((entry) => {
    assertPlainObject(entry, 'Suppression entry', 'invalid_suppressions');
    assertExactKeys(entry, ['findingId', 'reason'], 'Suppression entry', 'invalid_suppressions');
    if (typeof entry.findingId !== 'string' || entry.findingId.trim() === '') {
      reviewError('Suppression entry must include a nonempty string findingId.', 'invalid_suppressions');
    }
    assertSafeFindingId(entry.findingId, 'Suppression entry findingId', 'invalid_suppressions');
    if (typeof entry.reason !== 'string' || entry.reason.trim() === '') {
      reviewError('Suppression entry must include a nonempty string reason.', 'invalid_suppressions');
    }
    if (seen.has(entry.findingId)) {
      reviewError(`Suppressions file contains duplicate findingId "${entry.findingId}".`, 'invalid_suppressions');
    }
    seen.add(entry.findingId);
    return {
      findingId: entry.findingId,
      reason: entry.reason.trim(),
    };
  });

  return {
    suppressions,
    suppressionCount: suppressions.length,
    byFindingId: new Map(suppressions.map((entry) => [entry.findingId, entry.reason])),
  };
}

function normalizeFailOn(value) {
  if (value == null || value === '') return null;
  const failOn = utils_normalizeString(value).trim().toLowerCase();
  if (!SEVERITY_ORDER.has(failOn)) {
    reviewError('--fail-on must be one of error, warning, or note.', 'invalid_fail_on');
  }
  return failOn;
}

function shouldGateFinding(finding, failOn) {
  if (!failOn || finding.review?.baselineState !== 'new' || finding.review?.suppressed) return false;
  return (SEVERITY_ORDER.get(finding.severity) ?? 99) <= SEVERITY_ORDER.get(failOn);
}

function emptyBaselineInfo() {
  return {
    findingIds: new Set(),
    findingCount: 0,
  };
}

function emptySuppressionsInfo() {
  return {
    suppressions: [],
    suppressionCount: 0,
    byFindingId: new Map(),
  };
}

function applyReviewPolicy(diff, {
  baseline = null,
  suppressions = null,
  failOn = null,
} = {}) {
  assertPlainObject(diff, 'Diff report');
  const findings = Array.isArray(diff.findings) ? diff.findings : [];
  const baselineProvided = baseline != null;
  const baselineInfo = baselineProvided ? validateBaselineReport(baseline) : emptyBaselineInfo();
  const suppressionsInfo = suppressions != null ? validateSuppressionsConfig(suppressions) : emptySuppressionsInfo();
  const usedSuppressionIds = new Set();
  const normalizedFailOn = normalizeFailOn(failOn);

  const reviewedFindings = findings.map((finding) => {
    const baselineState = baselineInfo.findingIds.has(finding.id) ? 'existing' : 'new';
    const suppressionReason = suppressionsInfo.byFindingId.get(finding.id);
    if (suppressionReason) usedSuppressionIds.add(finding.id);
    return {
      ...finding,
      review: {
        baselineState,
        suppressed: Boolean(suppressionReason),
        ...(suppressionReason ? { suppressionReason } : {}),
      },
    };
  });
  const gateFindingIds = reviewedFindings
    .filter((finding) => shouldGateFinding(finding, normalizedFailOn))
    .map((finding) => finding.id)
    .sort(compareLocale);

  return {
    ...diff,
    findings: reviewedFindings,
    reviewPolicy: {
      baselineProvided,
      baselineFindingCount: baselineInfo.findingCount,
      suppressionCount: suppressionsInfo.suppressionCount,
      unusedSuppressionCount: suppressionsInfo.suppressionCount - usedSuppressionIds.size,
      findings: {
        new: reviewedFindings.filter((finding) => finding.review.baselineState === 'new').length,
        existing: reviewedFindings.filter((finding) => finding.review.baselineState === 'existing').length,
        suppressed: reviewedFindings.filter((finding) => finding.review.suppressed).length,
        actionable: reviewedFindings.filter((finding) => (
          finding.review.baselineState === 'new' && !finding.review.suppressed
        )).length,
      },
      failOn: normalizedFailOn,
      gateTriggered: gateFindingIds.length > 0,
      gateFindingIds,
    },
  };
}

;// CONCATENATED MODULE: ./src/lib/diff-snapshots.js





const DIFF_SCHEMA_VERSION = '1.1.0';
const SUPPORTED_SNAPSHOT_SCHEMA_VERSION = '1.2.0';
const FINDING_IDENTITY_VERSION = '2';

const STATIC_LIMITATIONS = [
  'IronGlancer diffs compare saved static-analysis snapshots; they do not execute code or claim runtime behavior.',
  'Function dependencies are static identifier-use evidence, not a complete runtime call graph.',
  'Source text and absolute project roots are intentionally excluded from diff JSON, HTML, and SARIF output.',
  'Fan-in and fan-out findings use a conservative threshold: at least 3 new edges and at least 2x the previous count.',
];
const FAN_INCREASE_THRESHOLD = {
  minimumDelta: 3,
  minimumRatio: 2,
};

const diff_snapshots_SEVERITY_ORDER = new Map([
  ['error', 0],
  ['warning', 1],
  ['note', 2],
]);

const RULE_ORDER = new Map([
  ['IRONG_DIFF_BROWSER_INCOMPATIBLE_IMPORT_ADDED', 0],
  ['IRONG_DIFF_UNRESOLVED_IMPORT_ADDED', 1],
  ['IRONG_DIFF_ROUTE_REMOVED', 2],
  ['IRONG_DIFF_LAZY_BOUNDARY_CHANGED', 3],
  ['IRONG_DIFF_ENTRY_GROWTH', 4],
  ['IRONG_DIFF_COMPONENT_CYCLE_ADDED', 5],
  ['IRONG_DIFF_BROWSER_API_ADDED', 6],
  ['IRONG_DIFF_REMOTE_IMPORT_ADDED', 7],
  ['IRONG_DIFF_EXPORT_REMOVED', 20],
  ['IRONG_DIFF_EXPORT_NARROWED', 21],
  ['IRONG_DIFF_REACHABILITY_REGRESSION', 22],
  ['IRONG_DIFF_MODULE_CYCLE_ADDED', 23],
  ['IRONG_DIFF_FUNCTION_CYCLE_ADDED', 24],
  ['IRONG_DIFF_CROSS_FILE_EDGE_ADDED', 25],
  ['IRONG_DIFF_FAN_INCREASE', 26],
]);

const RULE_DEFINITIONS = [
  {
    id: 'IRONG_DIFF_BROWSER_INCOMPATIBLE_IMPORT_ADDED',
    name: 'Browser-incompatible Node builtin import added',
    shortDescription: 'A reachable browser module added a Node builtin import.',
    help: 'Review browser entry reachability and bundler polyfill assumptions. IronGlancer reports static import evidence only.',
  },
  {
    id: 'IRONG_DIFF_UNRESOLVED_IMPORT_ADDED',
    name: 'Unresolved browser import added',
    shortDescription: 'A reachable browser module added an unresolved local import.',
    help: 'Review aliases, import maps, root-relative routes, and file moves for this static import.',
  },
  {
    id: 'IRONG_DIFF_ROUTE_REMOVED',
    name: 'Route removed',
    shortDescription: 'A route adapter record disappeared.',
    help: 'Review route table changes. IronGlancer reports static adapter evidence and does not execute a router.',
  },
  {
    id: 'IRONG_DIFF_LAZY_BOUNDARY_CHANGED',
    name: 'Lazy boundary changed',
    shortDescription: 'A lazy boundary was added or removed.',
    help: 'Review dynamic import, React.lazy, and worker boundary changes as structural loading changes only.',
  },
  {
    id: 'IRONG_DIFF_ENTRY_GROWTH',
    name: 'Entry module growth',
    shortDescription: 'Reachable browser entry size grew materially.',
    help: 'Review reachable module count and line count changes from the configured browser entry. This is structural size evidence, not performance impact.',
  },
  {
    id: 'IRONG_DIFF_COMPONENT_CYCLE_ADDED',
    name: 'Component cycle added',
    shortDescription: 'A new JSX render cycle appeared between component-shaped declarations.',
    help: 'Component cycles are computed from saved JSX render edges and do not prove runtime render recursion.',
  },
  {
    id: 'IRONG_DIFF_BROWSER_API_ADDED',
    name: 'Browser API added',
    shortDescription: 'A reachable module added a browser global/API reference.',
    help: 'Review added browser API touchpoints as static source evidence.',
  },
  {
    id: 'IRONG_DIFF_REMOTE_IMPORT_ADDED',
    name: 'Remote import added',
    shortDescription: 'A reachable browser module added a remote import.',
    help: 'Review remote import policy and import-map changes. IronGlancer reports static import specifiers only.',
  },
  {
    id: 'IRONG_DIFF_EXPORT_REMOVED',
    name: 'Exported function removed',
    shortDescription: 'An exported or public static function disappeared.',
    help: 'Review callers before removing exported/static public functions. IronGlancer compares static snapshot export metadata only.',
  },
  {
    id: 'IRONG_DIFF_EXPORT_NARROWED',
    name: 'Export surface narrowed',
    shortDescription: 'A function export surface became narrower.',
    help: 'Review consumers when exported names or export kinds are removed. IronGlancer does not prove runtime usage.',
  },
  {
    id: 'IRONG_DIFF_REACHABILITY_REGRESSION',
    name: 'Reachability regression',
    shortDescription: 'A reachable module or function became unreachable.',
    help: 'Static reachability follows IronGlancer import analysis from the configured entry; dynamic routing may be outside the snapshot.',
  },
  {
    id: 'IRONG_DIFF_MODULE_CYCLE_ADDED',
    name: 'New module dependency cycle',
    shortDescription: 'A new strongly connected module dependency set appeared.',
    help: 'Module cycles are computed from saved local dependency edges and sorted deterministically.',
  },
  {
    id: 'IRONG_DIFF_FUNCTION_CYCLE_ADDED',
    name: 'New function dependency cycle',
    shortDescription: 'A new strongly connected function dependency set appeared.',
    help: 'Function cycles use static identifier-use edges, not runtime call graph proof.',
  },
  {
    id: 'IRONG_DIFF_CROSS_FILE_EDGE_ADDED',
    name: 'New cross-file function edge',
    shortDescription: 'A new static function dependency crosses module boundaries.',
    help: 'Cross-file function edges are static review evidence and may represent references rather than runtime calls.',
  },
  {
    id: 'IRONG_DIFF_FAN_INCREASE',
    name: 'Material fan-in or fan-out increase',
    shortDescription: 'A function fan metric increased by at least 3 and at least 2x.',
    help: 'Fan findings are conservative structural review prompts based on saved static function edges.',
  },
].sort((a, b) => (RULE_ORDER.get(a.id) ?? 99) - (RULE_ORDER.get(b.id) ?? 99));

const ENTITY_ORDER = new Map([
  ['module', 0],
  ['function', 1],
  ['browser-incompatible-import', 2],
  ['unresolved-import', 3],
  ['remote-import', 4],
  ['route', 5],
  ['lazy-boundary', 6],
  ['component-cycle', 7],
  ['browser-api', 8],
]);

class diff_snapshots_SnapshotDiffError extends Error {
  constructor(message, code = 'snapshot_diff_error') {
    super(message);
    this.name = 'SnapshotDiffError';
    this.code = code;
  }
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stableJson(value[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value);
}

function stableHash(value) {
  return (0,external_node_crypto_namespaceObject.createHash)('sha256').update(stableJson(value)).digest('hex').slice(0, 16);
}

function uniqueSortedStrings(value) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => utils_normalizeString(item).trim()).filter(Boolean))).sort(compareLocale)
    : [];
}

function normalizeBool(value) {
  return value == null ? null : Boolean(value);
}

function invalidSnapshot(role, message) {
  throw new diff_snapshots_SnapshotDiffError(`${role} snapshot invalid: ${message}`, 'invalid_snapshot');
}

function displayValue(value) {
  return typeof value === 'string' ? `"${value}"` : String(value);
}

function hasOwnValue(object, field) {
  return Object.prototype.hasOwnProperty.call(object, field) && object[field] != null;
}

function isValidSnapshotPath(value) {
  const raw = utils_normalizeString(value).trim();
  if (!raw || /[\u0000-\u001f\u007f]/.test(raw)) return false;
  if (raw.includes('\\') || raw.startsWith('/') || /^[A-Za-z]:[\\/]/.test(raw)) return false;
  const segments = raw.split('/');
  if (!segments.every((part) => part && part !== '.' && part !== '..')) return false;
  try {
    segments.forEach((segment) => encodeURIComponent(segment));
    return true;
  } catch {
    return false;
  }
}

function assertValidPath(role, kind, value) {
  const raw = utils_normalizeString(value).trim();
  if (!isValidSnapshotPath(raw)) invalidSnapshot(role, `malformed ${kind} path "${raw}".`);
}

function assertPositiveIntegerLocation(role, label, field, value) {
  if (!Number.isInteger(value) || value <= 0) {
    invalidSnapshot(role, `invalid ${label} ${field} ${displayValue(value)}.`);
  }
}

function assertOptionalPositiveIntegerLocation(role, label, field, source = {}) {
  if (!hasOwnValue(source, field)) return;
  assertPositiveIntegerLocation(role, label, field, source[field]);
}

function assertOrderedLocations(role, label, source = {}, startField = 'startLine', endField = 'endLine') {
  if (
    hasOwnValue(source, startField)
    && hasOwnValue(source, endField)
    && Number.isInteger(source[startField])
    && Number.isInteger(source[endField])
    && source[endField] < source[startField]
  ) {
    invalidSnapshot(role, `${label} ${endField} must be greater than or equal to ${startField}.`);
  }
}

function assertNoDuplicateNonemptyValues(role, values, label) {
  const seen = new Set();
  for (const value of values.map((item) => utils_normalizeString(item).trim()).filter(Boolean).sort(compareLocale)) {
    if (seen.has(value)) invalidSnapshot(role, `duplicate ${label} "${value}".`);
    seen.add(value);
  }
}

function assertNoDuplicateFunctionEdgeIdentities(role, functionEdges) {
  const seen = new Set();
  for (const identity of functionEdges.map(normalizedFunctionEdgeIdentity).filter(Boolean).sort(compareLocale)) {
    if (seen.has(identity)) invalidSnapshot(role, 'duplicate function edge identity.');
    seen.add(identity);
  }
}

function assertKnownModulePath(role, modulePaths, kind, value) {
  const pathValue = utils_normalizeString(value).trim();
  assertValidPath(role, kind, pathValue);
  if (!modulePaths.has(pathValue)) invalidSnapshot(role, `${kind} "${pathValue}" is not declared in modules.`);
}

function functionLabel(node = {}) {
  const modulePath = utils_normalizeString(node.modulePath).trim() || 'unknown';
  const name = utils_normalizeString(node.name).trim() || utils_normalizeString(node.id).trim() || 'unknown';
  return `${modulePath}:${name}`;
}

function assertFunctionNodeLocations(role, rawNode = {}, node = {}) {
  for (const field of ['startLine', 'endLine', 'declarationLine']) {
    assertOptionalPositiveIntegerLocation(role, 'function', field, rawNode);
  }
  assertOrderedLocations(role, `function "${functionLabel(node)}"`, rawNode);
}

function assertFunctionEdgeLocations(role, rawEdge = {}) {
  for (const field of ['sourceStartLine', 'sourceEndLine', 'targetStartLine', 'targetEndLine']) {
    assertOptionalPositiveIntegerLocation(role, 'function edge', field, rawEdge);
  }
  assertOrderedLocations(role, 'function edge source', rawEdge, 'sourceStartLine', 'sourceEndLine');
  assertOrderedLocations(role, 'function edge target', rawEdge, 'targetStartLine', 'targetEndLine');
  if (hasOwnValue(rawEdge, 'usageLines')) {
    const usageLines = Array.isArray(rawEdge.usageLines) ? rawEdge.usageLines : [];
    for (const line of usageLines) {
      assertPositiveIntegerLocation(role, 'function edge usage', 'line', line);
    }
  }
  if (hasOwnValue(rawEdge, 'usages')) {
    const usages = Array.isArray(rawEdge.usages) ? rawEdge.usages : [];
    for (const usage of usages) {
      if (!hasOwnValue(usage, 'line')) continue;
      assertPositiveIntegerLocation(role, 'function edge usage', 'line', usage.line);
    }
  }
}

function normalizedEdgeImportIdentity(edge) {
  const info = edge.import;
  if (!info) return '';
  return [
    info.loadKind,
    info.bindingKind,
    info.importedName,
    info.localName,
    info.inferred,
  ].join('\u0000');
}

function normalizedFunctionEdgeIdentity(edge) {
  return [
    edge.sourceId,
    edge.targetId,
    edge.scope,
    normalizedEdgeImportIdentity(edge),
  ].join('\u0000');
}

function validateSnapshotIdentity({
  role,
  rawSnapshot,
  modules,
  functions,
  functionEdges,
  importEdges,
}) {
  assertNoDuplicateNonemptyValues(role, modules.map((module) => module.path), 'module path');
  for (const module of modules) {
    assertValidPath(role, 'module', module.path);
  }

  const modulePaths = new Set(modules.map((module) => module.path));
  for (const module of modules) {
    for (const dependency of module.localDependencies) {
      assertKnownModulePath(role, modulePaths, 'module dependency', dependency);
    }
  }

  assertNoDuplicateNonemptyValues(role, functions.map((node) => node.id), 'function id');
  assertNoDuplicateNonemptyValues(role, functions.map((node) => node.stableId), 'function stableId');
  const rawFunctions = Array.isArray(rawSnapshot.functionMap?.functions) ? rawSnapshot.functionMap.functions : [];
  functions.forEach((node) => {
    assertKnownModulePath(role, modulePaths, 'function modulePath', node.modulePath);
    if (node.implementationFingerprint && !/^impl_[a-f0-9]{16}$/.test(node.implementationFingerprint)) {
      invalidSnapshot(role, `invalid function implementationFingerprint "${node.implementationFingerprint}".`);
    }
  });
  rawFunctions.forEach((rawNode) => assertFunctionNodeLocations(role, rawNode, normalizeFunctionNode(rawNode)));

  const functionById = new Map(functions.map((node) => [node.id, node]));
  const functionIds = new Set(functionById.keys());
  assertNoDuplicateNonemptyValues(role, functionEdges.map((edge) => edge.id), 'function edge id');
  assertNoDuplicateFunctionEdgeIdentities(role, functionEdges);
  const rawEdges = Array.isArray(rawSnapshot.functionMap?.edges) ? rawSnapshot.functionMap.edges : [];
  functionEdges.forEach((edge) => {
    if (!functionIds.has(edge.sourceId)) invalidSnapshot(role, `dangling function edge sourceId "${edge.sourceId}".`);
    if (!functionIds.has(edge.targetId)) invalidSnapshot(role, `dangling function edge targetId "${edge.targetId}".`);
    assertKnownModulePath(role, modulePaths, 'function edge sourceModulePath', edge.sourceModulePath);
    assertKnownModulePath(role, modulePaths, 'function edge targetModulePath', edge.targetModulePath);
    if (functionById.get(edge.sourceId)?.modulePath !== edge.sourceModulePath) {
      invalidSnapshot(role, `function edge sourceModulePath "${edge.sourceModulePath}" does not match source function modulePath.`);
    }
    if (functionById.get(edge.targetId)?.modulePath !== edge.targetModulePath) {
      invalidSnapshot(role, `function edge targetModulePath "${edge.targetModulePath}" does not match target function modulePath.`);
    }
  });
  rawEdges.forEach((rawEdge) => assertFunctionEdgeLocations(role, rawEdge));

  assertNoDuplicateNonemptyValues(role, importEdges.map(importEdgeKey), 'import edge identity');
  for (const edge of importEdges) {
    assertKnownModulePath(role, modulePaths, 'import edge sourcePath', edge.sourcePath);
    assertKnownModulePath(role, modulePaths, 'import edge targetPath', edge.targetPath);
  }
}

function normalizeModule(module = {}) {
  return {
    path: utils_normalizeString(module.path).trim(),
    lineCount: Number.isInteger(module.lineCount) ? module.lineCount : 0,
    reachable: normalizeBool(module.reachable),
    isJsx: Boolean(module.isJsx),
    localDependencies: uniqueSortedStrings(module.localDependencies),
    externalDependencies: uniqueSortedStrings(module.externalDependencies),
    importRefs: Array.isArray(module.importRefs) ? module.importRefs.map((ref) => ({
      ...ref,
      resolution: ['local', 'asset', 'external', 'remote', 'browser-incompatible', 'unresolved'].includes(ref?.resolution)
        ? ref.resolution
        : ref?.resolution,
    })) : [],
  };
}

function normalizeImportEdge(edge = {}) {
  return {
    sourcePath: utils_normalizeString(edge.sourcePath).trim(),
    targetPath: utils_normalizeString(edge.targetPath).trim(),
    loadKinds: uniqueSortedStrings(edge.loadKinds),
    imports: Array.isArray(edge.imports)
      ? edge.imports.map((binding) => ({
        imported: utils_normalizeString(binding?.imported).trim(),
        local: utils_normalizeString(binding?.local).trim(),
        kind: utils_normalizeString(binding?.kind).trim(),
        inferred: Boolean(binding?.inferred),
      })).sort((a, b) => compareLocale(a.kind, b.kind)
        || compareLocale(a.imported, b.imported)
        || compareLocale(a.local, b.local))
      : [],
  };
}

function normalizeFunctionNode(node = {}) {
  return {
    id: utils_normalizeString(node.id).trim(),
    stableId: utils_normalizeString(node.stableId).trim(),
    modulePath: utils_normalizeString(node.modulePath).trim(),
    name: utils_normalizeString(node.name).trim(),
    declarationName: utils_normalizeString(node.declarationName || node.name).trim(),
    kind: utils_normalizeString(node.kind || 'function').trim() || 'function',
    implementationFingerprint: utils_normalizeString(node.implementationFingerprint).trim() || null,
    component: Boolean(node.component),
    reachable: normalizeBool(node.reachable),
    exported: normalizeBool(node.exported),
    exportedNames: uniqueSortedStrings(node.exportedNames),
    exportKinds: uniqueSortedStrings(node.exportKinds),
    scopePath: utils_normalizeString(node.scopePath).trim(),
    startLine: Number.isInteger(node.startLine) ? node.startLine : null,
    endLine: Number.isInteger(node.endLine) ? node.endLine : null,
    lineCount: Number.isInteger(node.lineCount) ? node.lineCount : null,
    placementAssessment: utils_normalizeString(node.placement?.assessment?.assessment).trim() || null,
  };
}

function normalizeFunctionImportInfo(value = {}) {
  const info = {
    specifier: utils_normalizeString(value.specifier).trim(),
    loadKind: utils_normalizeString(value.loadKind || 'import').trim() || 'import',
    bindingKind: utils_normalizeString(value.bindingKind || 'named').trim() || 'named',
    importedName: utils_normalizeString(value.importedName).trim(),
    localName: utils_normalizeString(value.localName).trim(),
    inferred: Boolean(value.inferred),
  };
  return Object.values(info).some((entry) => entry === true || utils_normalizeString(entry).trim()) ? info : null;
}

function normalizeFunctionEdge(edge = {}) {
  const syntaxKinds = uniqueSortedStrings(edge.syntaxKinds);
  return {
    id: utils_normalizeString(edge.id).trim(),
    scope: utils_normalizeString(edge.scope || 'same-module').trim() || 'same-module',
    relationKind: utils_normalizeString(edge.relationKind).trim() || 'static-reference',
    syntaxKinds,
    referenceCount: Number.isInteger(edge.referenceCount) ? edge.referenceCount : 0,
    sourceId: utils_normalizeString(edge.sourceId).trim(),
    sourceModulePath: utils_normalizeString(edge.sourceModulePath).trim(),
    sourceFunction: utils_normalizeString(edge.sourceFunction).trim(),
    sourceKind: utils_normalizeString(edge.sourceKind || 'function').trim() || 'function',
    sourceStartLine: Number.isInteger(edge.sourceStartLine) ? edge.sourceStartLine : null,
    sourceEndLine: Number.isInteger(edge.sourceEndLine) ? edge.sourceEndLine : null,
    targetId: utils_normalizeString(edge.targetId).trim(),
    targetModulePath: utils_normalizeString(edge.targetModulePath).trim(),
    targetFunction: utils_normalizeString(edge.targetFunction).trim(),
    targetKind: utils_normalizeString(edge.targetKind || 'function').trim() || 'function',
    targetStartLine: Number.isInteger(edge.targetStartLine) ? edge.targetStartLine : null,
    targetEndLine: Number.isInteger(edge.targetEndLine) ? edge.targetEndLine : null,
    import: edge.import && typeof edge.import === 'object' ? normalizeFunctionImportInfo(edge.import) : null,
  };
}

function normalizeFrontEndRecord(record = {}) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const normalized = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') normalized[key] = utils_normalizeString(value).trim();
    else if (typeof value === 'number' || typeof value === 'boolean' || value == null) normalized[key] = value;
    else if (Array.isArray(value)) normalized[key] = value.map((item) => (
      typeof item === 'string' ? utils_normalizeString(item).trim() : item
    ));
    else if (typeof value === 'object') normalized[key] = normalizeFrontEndRecord(value);
  }
  return normalized;
}

function normalizeFrontEndRecords(value) {
  return Array.isArray(value)
    ? value.map(normalizeFrontEndRecord).filter(Boolean)
      .sort((a, b) => compareLocale(stableJson(a), stableJson(b)))
    : [];
}

function normalizeSnapshot(rawSnapshot, role) {
  if (!rawSnapshot || typeof rawSnapshot !== 'object' || Array.isArray(rawSnapshot)) {
    throw new diff_snapshots_SnapshotDiffError(`${role} snapshot must be a JSON object.`, 'malformed_snapshot');
  }
  const meta = rawSnapshot.meta && typeof rawSnapshot.meta === 'object' ? rawSnapshot.meta : {};
  const schemaVersion = utils_normalizeString(meta.schemaVersion).trim();
  if (schemaVersion !== SUPPORTED_SNAPSHOT_SCHEMA_VERSION) {
    throw new diff_snapshots_SnapshotDiffError(
      `${role} snapshot schemaVersion must be ${SUPPORTED_SNAPSHOT_SCHEMA_VERSION}.`,
      'incompatible_snapshot',
    );
  }
  if (!Array.isArray(rawSnapshot.modules)) {
    throw new diff_snapshots_SnapshotDiffError(`${role} snapshot must include a modules array.`, 'malformed_snapshot');
  }
  if (!rawSnapshot.functionMap || !Array.isArray(rawSnapshot.functionMap.functions) || !Array.isArray(rawSnapshot.functionMap.edges)) {
    throw new diff_snapshots_SnapshotDiffError(`${role} snapshot must include functionMap.functions and functionMap.edges arrays.`, 'malformed_snapshot');
  }
  if (!Array.isArray(rawSnapshot.importEdges)) {
    throw new diff_snapshots_SnapshotDiffError(`${role} snapshot must include an importEdges array.`, 'malformed_snapshot');
  }

  const modules = rawSnapshot.modules.map(normalizeModule)
    .sort((a, b) => compareLocale(a.path, b.path));
  if (modules.some((module) => !module.path)) {
    throw new diff_snapshots_SnapshotDiffError(`${role} snapshot contains a module without a path.`, 'malformed_snapshot');
  }
  const functions = rawSnapshot.functionMap.functions.map(normalizeFunctionNode)
    .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
      || (a.startLine || 0) - (b.startLine || 0)
      || compareLocale(a.name, b.name)
      || compareLocale(a.stableId, b.stableId));
  if (functions.some((node) => !node.id || !node.stableId || !node.modulePath || !node.name)) {
    throw new diff_snapshots_SnapshotDiffError(`${role} snapshot contains a function without id, stableId, modulePath, or name.`, 'malformed_snapshot');
  }
  const functionEdges = rawSnapshot.functionMap.edges.map(normalizeFunctionEdge)
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || (a.sourceStartLine || 0) - (b.sourceStartLine || 0)
      || compareLocale(a.targetModulePath, b.targetModulePath)
      || (a.targetStartLine || 0) - (b.targetStartLine || 0)
      || compareLocale(a.scope, b.scope));
  if (functionEdges.some((edge) => !edge.sourceId || !edge.targetId)) {
    throw new diff_snapshots_SnapshotDiffError(`${role} snapshot contains a function edge without sourceId or targetId.`, 'malformed_snapshot');
  }
  const importEdges = rawSnapshot.importEdges.map(normalizeImportEdge)
    .sort((a, b) => compareLocale(a.sourcePath, b.sourcePath)
      || compareLocale(a.targetPath, b.targetPath)
      || compareLocale(stableJson(a.imports), stableJson(b.imports)));
  if (importEdges.some((edge) => !edge.sourcePath || !edge.targetPath)) {
    throw new diff_snapshots_SnapshotDiffError(`${role} snapshot contains an import edge without sourcePath or targetPath.`, 'malformed_snapshot');
  }

  const entry = utils_normalizeString(rawSnapshot.entry || meta.entry).trim() || null;
  if (entry && !isValidSnapshotPath(entry)) {
    throw new diff_snapshots_SnapshotDiffError(`${role} snapshot contains a malformed snapshot entry path.`, 'invalid_snapshot');
  }

  validateSnapshotIdentity({
    role,
    rawSnapshot,
    modules,
    functions,
    functionEdges,
    importEdges,
  });

  return {
    entry,
    meta: {
      schemaVersion,
      generatedAt: utils_normalizeString(meta.generatedAt).trim() || null,
      buildId: utils_normalizeString(meta.buildId).trim() || null,
      gitCommit: utils_normalizeString(meta.gitCommit).trim() || null,
      analysis: meta.analysis && typeof meta.analysis === 'object' ? meta.analysis : null,
    },
    modules,
    functions,
    functionEdges,
    importEdges,
    components: normalizeFrontEndRecords(rawSnapshot.components),
    componentEdges: normalizeFrontEndRecords(rawSnapshot.componentEdges),
    routes: normalizeFrontEndRecords(rawSnapshot.routes),
    lazyBoundaries: normalizeFrontEndRecords(rawSnapshot.lazyBoundaries),
    browserApis: normalizeFrontEndRecords(rawSnapshot.browserApis),
    remoteImports: normalizeFrontEndRecords(rawSnapshot.remoteImports),
    unresolvedImports: normalizeFrontEndRecords(rawSnapshot.unresolvedImports),
    browserIncompatibleImports: normalizeFrontEndRecords(rawSnapshot.browserIncompatibleImports),
    limitations: uniqueSortedStrings(STATIC_LIMITATIONS),
  };
}

function snapshotIdentity(snapshot, label) {
  return {
    label,
    entry: snapshot.entry,
    schemaVersion: snapshot.meta.schemaVersion,
    generatedAt: snapshot.meta.generatedAt,
    buildId: snapshot.meta.buildId,
    gitCommit: snapshot.meta.gitCommit,
    analysis: snapshot.meta.analysis || null,
  };
}

function collectionCounts(collection) {
  return {
    added: collection.added.length,
    removed: collection.removed.length,
    changed: collection.changed.length,
  };
}

function moduleSummary(module) {
  return {
    path: module.path,
    lineCount: module.lineCount,
    reachable: module.reachable,
    isJsx: module.isJsx,
    localDependencies: module.localDependencies,
    externalDependencies: module.externalDependencies,
  };
}

function importEdgeKey(edge) {
  return [
    edge.sourcePath,
    edge.targetPath,
    edge.loadKinds.join(','),
    stableJson(edge.imports),
  ].join('\u0000');
}

function moduleImportEdges(snapshot, modulePath) {
  return snapshot.importEdges
    .filter((edge) => edge.sourcePath === modulePath)
    .map((edge) => ({
      sourcePath: edge.sourcePath,
      targetPath: edge.targetPath,
      loadKinds: edge.loadKinds,
      imports: edge.imports,
    }))
    .sort((a, b) => compareLocale(a.targetPath, b.targetPath)
      || compareLocale(a.loadKinds.join(','), b.loadKinds.join(','))
      || compareLocale(stableJson(a.imports), stableJson(b.imports)));
}

function valuesEqual(a, b) {
  return stableJson(a) === stableJson(b);
}

function setChange(field, baseValue, headValue) {
  return valuesEqual(baseValue, headValue) ? null : { field, base: baseValue, head: headValue };
}

function importEdgeChange(base, head, modulePath) {
  const baseEdges = moduleImportEdges(base, modulePath);
  const headEdges = moduleImportEdges(head, modulePath);
  const baseByKey = new Map(baseEdges.map((edge) => [importEdgeKey(edge), edge]));
  const headByKey = new Map(headEdges.map((edge) => [importEdgeKey(edge), edge]));
  const added = headEdges.filter((edge) => !baseByKey.has(importEdgeKey(edge)));
  const removed = baseEdges.filter((edge) => !headByKey.has(importEdgeKey(edge)));
  return added.length || removed.length ? { field: 'importEdges', added, removed } : null;
}

function compareModules(base, head) {
  const baseByPath = new Map(base.modules.map((module) => [module.path, module]));
  const headByPath = new Map(head.modules.map((module) => [module.path, module]));
  const added = head.modules
    .filter((module) => !baseByPath.has(module.path))
    .map(moduleSummary)
    .sort((a, b) => compareLocale(a.path, b.path));
  const removed = base.modules
    .filter((module) => !headByPath.has(module.path))
    .map(moduleSummary)
    .sort((a, b) => compareLocale(a.path, b.path));
  const changed = [];

  for (const baseModule of base.modules) {
    const headModule = headByPath.get(baseModule.path);
    if (!headModule) continue;
    const changes = [
      setChange('reachable', baseModule.reachable, headModule.reachable),
      setChange('isJsx', baseModule.isJsx, headModule.isJsx),
      setChange('lineCount', baseModule.lineCount, headModule.lineCount),
      setChange('localDependencies', baseModule.localDependencies, headModule.localDependencies),
      setChange('externalDependencies', baseModule.externalDependencies, headModule.externalDependencies),
      importEdgeChange(base, head, baseModule.path),
    ].filter(Boolean);
    if (changes.length === 0) continue;
    changed.push({
      path: baseModule.path,
      base: moduleSummary(baseModule),
      head: moduleSummary(headModule),
      changedFields: changes.map((change) => change.field),
      changes,
    });
  }

  changed.sort((a, b) => compareLocale(a.path, b.path));
  return { added, removed, changed };
}

function functionLocation(node) {
  return {
    path: node.modulePath,
    startLine: node.startLine,
    endLine: node.endLine,
  };
}

function functionSummary(node) {
  return {
    id: node.id,
    stableId: node.stableId,
    modulePath: node.modulePath,
    name: node.name,
    declarationName: node.declarationName,
    kind: node.kind,
    component: node.component,
    reachable: node.reachable,
    exported: node.exported,
    exportedNames: node.exportedNames,
    exportKinds: node.exportKinds,
    lineCount: node.lineCount,
    placementAssessment: node.placementAssessment,
    location: functionLocation(node),
  };
}

function hasMatchingImplementationFingerprint(baseNode, headNode) {
  return Boolean(baseNode.implementationFingerprint)
    && baseNode.implementationFingerprint === headNode.implementationFingerprint;
}

function compareFunctionPairs(base, head) {
  const baseByStableId = new Map(base.functions.map((node) => [node.stableId, node]));
  const headByStableId = new Map(head.functions.map((node) => [node.stableId, node]));
  const matches = [];
  const matchedBase = new Set();
  const matchedHead = new Set();

  for (const baseNode of base.functions) {
    const headNode = headByStableId.get(baseNode.stableId);
    if (!headNode) continue;
    matches.push({
      base: baseNode,
      head: headNode,
      matchKind: 'exact',
      confidence: 'high',
    });
    matchedBase.add(baseNode.stableId);
    matchedHead.add(headNode.stableId);
  }

  const pairUnique = ({ matchKind, confidence, signatureFor, predicate }) => {
    const baseGroups = new Map();
    const headGroups = new Map();
    for (const node of base.functions.filter((candidate) => !matchedBase.has(candidate.stableId))) {
      const signature = signatureFor(node);
      if (!signature) continue;
      if (!baseGroups.has(signature)) baseGroups.set(signature, []);
      baseGroups.get(signature).push(node);
    }
    for (const node of head.functions.filter((candidate) => !matchedHead.has(candidate.stableId))) {
      const signature = signatureFor(node);
      if (!signature) continue;
      if (!headGroups.has(signature)) headGroups.set(signature, []);
      headGroups.get(signature).push(node);
    }

    const signatures = Array.from(new Set([...baseGroups.keys(), ...headGroups.keys()])).sort(compareLocale);
    for (const signature of signatures) {
      const baseGroup = baseGroups.get(signature) || [];
      const headGroup = headGroups.get(signature) || [];
      if (baseGroup.length !== 1 || headGroup.length !== 1) continue;
      const baseNode = baseGroup[0];
      const headNode = headGroup[0];
      if (!predicate(baseNode, headNode)) continue;
      matches.push({ base: baseNode, head: headNode, matchKind, confidence });
      matchedBase.add(baseNode.stableId);
      matchedHead.add(headNode.stableId);
    }
  };

  pairUnique({
    matchKind: 'move',
    confidence: 'high',
    signatureFor: (node) => [
      node.name,
      node.declarationName,
      node.kind,
      node.scopePath,
      node.lineCount,
      node.component,
      node.exported,
      node.exportedNames.join(','),
      node.exportKinds.join(','),
    ].join('\u0000'),
    predicate: (baseNode, headNode) => baseNode.modulePath !== headNode.modulePath
      && baseNode.name === headNode.name
      && hasMatchingImplementationFingerprint(baseNode, headNode),
  });

  pairUnique({
    matchKind: 'rename',
    confidence: 'medium',
    signatureFor: (node) => [
      node.modulePath,
      node.kind,
      node.scopePath,
      node.lineCount,
      node.startLine,
      node.endLine,
      node.component,
      node.exported,
      node.exportKinds.join(','),
    ].join('\u0000'),
    predicate: (baseNode, headNode) => baseNode.modulePath === headNode.modulePath
      && baseNode.name !== headNode.name
      && hasMatchingImplementationFingerprint(baseNode, headNode),
  });

  return {
    matches: matches.sort((a, b) => compareLocale(a.base.modulePath, b.base.modulePath)
      || compareLocale(a.base.name, b.base.name)
      || compareLocale(a.base.stableId, b.base.stableId)),
    unmatchedBase: base.functions.filter((node) => !matchedBase.has(node.stableId)),
    unmatchedHead: head.functions.filter((node) => !matchedHead.has(node.stableId)),
  };
}

function compareFunctions(base, head) {
  const { matches, unmatchedBase, unmatchedHead } = compareFunctionPairs(base, head);
  const changed = [];

  for (const match of matches) {
    const changes = [
      setChange('modulePath', match.base.modulePath, match.head.modulePath),
      setChange('name', match.base.name, match.head.name),
      setChange('exported', match.base.exported, match.head.exported),
      setChange('exportedNames', match.base.exportedNames, match.head.exportedNames),
      setChange('exportKinds', match.base.exportKinds, match.head.exportKinds),
      setChange('reachable', match.base.reachable, match.head.reachable),
      setChange('component', match.base.component, match.head.component),
      setChange('kind', match.base.kind, match.head.kind),
      setChange('lineCount', match.base.lineCount, match.head.lineCount),
      setChange('placementAssessment', match.base.placementAssessment, match.head.placementAssessment),
    ].filter(Boolean);
    if (changes.length === 0) continue;
    changed.push({
      stableId: match.base.stableId,
      matchKind: match.matchKind,
      confidence: match.confidence,
      base: functionSummary(match.base),
      head: functionSummary(match.head),
      changedFields: changes.map((change) => change.field),
      changes,
    });
  }

  changed.sort((a, b) => compareLocale(a.base.modulePath, b.base.modulePath)
    || compareLocale(a.base.name, b.base.name)
    || compareLocale(a.stableId, b.stableId));

  return {
    added: unmatchedHead.map(functionSummary)
      .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
        || compareLocale(a.name, b.name)
        || compareLocale(a.stableId, b.stableId)),
    removed: unmatchedBase.map(functionSummary)
      .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
        || compareLocale(a.name, b.name)
        || compareLocale(a.stableId, b.stableId)),
    changed,
    moves: matches
      .filter((match) => match.matchKind === 'move')
      .map((match) => ({
        matchKind: match.matchKind,
        confidence: match.confidence,
        base: functionSummary(match.base),
        head: functionSummary(match.head),
      }))
      .sort((a, b) => compareLocale(a.base.modulePath, b.base.modulePath)
        || compareLocale(a.base.name, b.base.name)
        || compareLocale(a.base.stableId, b.base.stableId)),
    renames: matches
      .filter((match) => match.matchKind === 'rename')
      .map((match) => ({
        matchKind: match.matchKind,
        confidence: match.confidence,
        base: functionSummary(match.base),
        head: functionSummary(match.head),
      }))
      .sort((a, b) => compareLocale(a.base.modulePath, b.base.modulePath)
        || compareLocale(a.base.name, b.base.name)
        || compareLocale(a.base.stableId, b.base.stableId)),
    matches,
  };
}

function comparisonIdForPair(baseStableId, headStableId) {
  return `pair:${baseStableId}->${headStableId}`;
}

function edgeFunctionMaps(base, head, functions) {
  const baseFunctionById = new Map(base.functions.map((node) => [node.id, node]));
  const headFunctionById = new Map(head.functions.map((node) => [node.id, node]));
  const baseComparisonIdByFunctionId = new Map();
  const headComparisonIdByFunctionId = new Map();
  for (const match of functions.matches) {
    const comparisonId = comparisonIdForPair(match.base.stableId, match.head.stableId);
    baseComparisonIdByFunctionId.set(match.base.id, comparisonId);
    headComparisonIdByFunctionId.set(match.head.id, comparisonId);
  }
  for (const node of base.functions) {
    if (!baseComparisonIdByFunctionId.has(node.id)) baseComparisonIdByFunctionId.set(node.id, `base:${node.stableId}`);
  }
  for (const node of head.functions) {
    if (!headComparisonIdByFunctionId.has(node.id)) headComparisonIdByFunctionId.set(node.id, `head:${node.stableId}`);
  }
  return {
    baseFunctionById,
    headFunctionById,
    baseComparisonIdByFunctionId,
    headComparisonIdByFunctionId,
  };
}

function edgeImportIdentity(edge) {
  const info = edge.import;
  if (!info) return '';
  return [
    info.loadKind,
    info.bindingKind,
    info.importedName,
    info.localName,
    info.inferred,
  ].join('\u0000');
}

function edgeKey(edge, comparisonIdByFunctionId) {
  return [
    comparisonIdByFunctionId.get(edge.sourceId) || '',
    comparisonIdByFunctionId.get(edge.targetId) || '',
    edge.scope,
    edgeImportIdentity(edge),
  ].join('\u0000');
}

function edgeSummary(edge, functionById) {
  const source = functionById.get(edge.sourceId);
  const target = functionById.get(edge.targetId);
  return {
    source: source ? functionSummary(source) : {
      id: edge.sourceId,
      modulePath: edge.sourceModulePath,
      name: edge.sourceFunction,
      kind: edge.sourceKind,
      location: { path: edge.sourceModulePath, startLine: edge.sourceStartLine, endLine: edge.sourceEndLine },
    },
    target: target ? functionSummary(target) : {
      id: edge.targetId,
      modulePath: edge.targetModulePath,
      name: edge.targetFunction,
      kind: edge.targetKind,
      location: { path: edge.targetModulePath, startLine: edge.targetStartLine, endLine: edge.targetEndLine },
    },
    scope: edge.scope,
    relationKind: edge.relationKind,
    syntaxKinds: edge.syntaxKinds,
    referenceCount: edge.referenceCount,
    ...(edge.import ? { import: edge.import } : {}),
  };
}

function compareEdges(base, head, functions) {
  const maps = edgeFunctionMaps(base, head, functions);
  const baseEdges = base.functionEdges
    .filter((edge) => maps.baseComparisonIdByFunctionId.has(edge.sourceId)
      && maps.baseComparisonIdByFunctionId.has(edge.targetId));
  const headEdges = head.functionEdges
    .filter((edge) => maps.headComparisonIdByFunctionId.has(edge.sourceId)
      && maps.headComparisonIdByFunctionId.has(edge.targetId));
  const baseByKey = new Map(baseEdges.map((edge) => [edgeKey(edge, maps.baseComparisonIdByFunctionId), edge]));
  const headByKey = new Map(headEdges.map((edge) => [edgeKey(edge, maps.headComparisonIdByFunctionId), edge]));
  const changed = [];

  for (const [key, baseEdge] of baseByKey) {
    const headEdge = headByKey.get(key);
    if (!headEdge) continue;
    const changes = [
      setChange('relationKind', baseEdge.relationKind, headEdge.relationKind),
      setChange('syntaxKinds', baseEdge.syntaxKinds, headEdge.syntaxKinds),
      setChange('referenceCount', baseEdge.referenceCount, headEdge.referenceCount),
    ].filter(Boolean);
    if (changes.length === 0) continue;
    changed.push({
      base: edgeSummary(baseEdge, maps.baseFunctionById),
      head: edgeSummary(headEdge, maps.headFunctionById),
      changedFields: changes.map((change) => change.field),
      changes,
    });
  }

  const sortEdges = (a, b) => compareLocale(a.source.modulePath, b.source.modulePath)
    || compareLocale(a.source.name, b.source.name)
    || compareLocale(a.target.modulePath, b.target.modulePath)
    || compareLocale(a.target.name, b.target.name)
    || compareLocale(a.scope, b.scope);

  return {
    added: headEdges
      .filter((edge) => !baseByKey.has(edgeKey(edge, maps.headComparisonIdByFunctionId)))
      .map((edge) => edgeSummary(edge, maps.headFunctionById))
      .sort(sortEdges),
    removed: baseEdges
      .filter((edge) => !headByKey.has(edgeKey(edge, maps.baseComparisonIdByFunctionId)))
      .map((edge) => edgeSummary(edge, maps.baseFunctionById))
      .sort(sortEdges),
    changed: changed.sort((a, b) => sortEdges(a.base, b.base)),
  };
}

function relativeLocation(pathValue, startLine = null, endLine = null) {
  return {
    path: pathValue,
    ...(Number.isInteger(startLine) ? { startLine } : {}),
    ...(Number.isInteger(endLine) ? { endLine } : {}),
  };
}

function createFinding({ ruleId, semanticIdentity, severity, confidence, message, evidence, location }) {
  const identity = {
    version: FINDING_IDENTITY_VERSION,
    ruleId,
    ...semanticIdentity,
  };
  return {
    id: `finding_v${FINDING_IDENTITY_VERSION}_${stableHash(identity)}`,
    identityVersion: FINDING_IDENTITY_VERSION,
    identity,
    ruleId,
    severity,
    confidence,
    message,
    evidence,
    ...(location?.path ? { location } : {}),
  };
}

function isPublicFunction(functionInfo = {}) {
  return functionInfo.exported === true || (Array.isArray(functionInfo.exportedNames) && functionInfo.exportedNames.length > 0);
}

function missingSetMembers(baseValues, headValues) {
  const headSet = new Set(headValues || []);
  return (baseValues || []).filter((value) => !headSet.has(value)).sort(compareLocale);
}

function exportFindings(functions) {
  const findings = [];
  for (const removed of functions.removed) {
    if (!isPublicFunction(removed)) continue;
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_EXPORT_REMOVED',
      semanticIdentity: {
        entityType: 'function',
        functionStableId: removed.stableId,
        modulePath: removed.modulePath,
        name: removed.name,
      },
      severity: 'error',
      confidence: 'high',
      message: `Exported function ${removed.name} was removed from the static public surface.`,
      evidence: {
        function: {
          stableId: removed.stableId,
          modulePath: removed.modulePath,
          name: removed.name,
        },
        exportedNames: removed.exportedNames,
        exportKinds: removed.exportKinds,
      },
      location: relativeLocation(removed.modulePath, removed.location?.startLine, removed.location?.endLine),
    }));
  }

  for (const change of functions.changed) {
    if (!isPublicFunction(change.base)) continue;
    const removedExportNames = change.base.exported === true && change.head.exported === false
      ? change.base.exportedNames
      : missingSetMembers(change.base.exportedNames, change.head.exportedNames);
    const removedExportKinds = missingSetMembers(change.base.exportKinds, change.head.exportKinds);
    if (change.base.exported === change.head.exported && removedExportNames.length === 0 && removedExportKinds.length === 0) {
      continue;
    }
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_EXPORT_NARROWED',
      semanticIdentity: {
        entityType: 'function',
        functionStableId: change.base.stableId,
        modulePath: change.base.modulePath,
        name: change.base.name,
      },
      severity: 'error',
      confidence: 'high',
      message: `Export surface for ${change.base.name} was narrowed in the static snapshot.`,
      evidence: {
        base: {
          stableId: change.base.stableId,
          modulePath: change.base.modulePath,
          name: change.base.name,
          exported: change.base.exported,
          exportedNames: change.base.exportedNames,
          exportKinds: change.base.exportKinds,
        },
        head: {
          stableId: change.head.stableId,
          modulePath: change.head.modulePath,
          name: change.head.name,
          exported: change.head.exported,
          exportedNames: change.head.exportedNames,
          exportKinds: change.head.exportKinds,
        },
        removedExportNames,
        removedExportKinds,
      },
      location: relativeLocation(change.head.modulePath, change.head.location?.startLine, change.head.location?.endLine),
    }));
  }
  return findings;
}

function reachabilityFindings(modules, functions) {
  const findings = [];
  for (const change of modules.changed) {
    if (change.base.reachable !== true || change.head.reachable !== false) continue;
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_REACHABILITY_REGRESSION',
      semanticIdentity: {
        entityType: 'module',
        path: change.base.path,
      },
      severity: 'warning',
      confidence: 'high',
      message: `Reachable module ${change.base.path} became unreachable in the static snapshot.`,
      evidence: {
        entityType: 'module',
        path: change.base.path,
        baseReachable: change.base.reachable,
        headReachable: change.head.reachable,
      },
      location: relativeLocation(change.head.path),
    }));
  }
  for (const change of functions.changed) {
    if (change.base.reachable !== true || change.head.reachable !== false) continue;
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_REACHABILITY_REGRESSION',
      semanticIdentity: {
        entityType: 'function',
        functionStableId: change.base.stableId,
        modulePath: change.base.modulePath,
        name: change.base.name,
      },
      severity: 'warning',
      confidence: 'high',
      message: `Reachable function ${change.base.name} became unreachable in the static snapshot.`,
      evidence: {
        entityType: 'function',
        stableId: change.base.stableId,
        modulePath: change.base.modulePath,
        name: change.base.name,
        baseReachable: change.base.reachable,
        headReachable: change.head.reachable,
      },
      location: relativeLocation(change.head.modulePath, change.head.location?.startLine, change.head.location?.endLine),
    }));
  }
  return findings;
}

function stronglyConnectedComponents(nodes, outgoingForNode) {
  const orderedNodes = [...nodes].sort(compareLocale);
  const indexByNode = new Map();
  const lowLinkByNode = new Map();
  const stack = [];
  const onStack = new Set();
  const components = [];
  let index = 0;

  const beginNode = (node) => {
    indexByNode.set(node, index);
    lowLinkByNode.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);
  };

  const finishNode = (node) => {
    if (lowLinkByNode.get(node) !== indexByNode.get(node)) return;
    const component = [];
    let current = null;
    do {
      current = stack.pop();
      onStack.delete(current);
      component.push(current);
    } while (current !== node);
    components.push(component.sort(compareLocale));
  };

  const visit = (startNode) => {
    const frames = [{
      node: startNode,
      neighbors: null,
      nextIndex: 0,
    }];

    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      if (!frame.neighbors) {
        beginNode(frame.node);
        frame.neighbors = [...outgoingForNode(frame.node)].sort(compareLocale);
      }

      if (frame.nextIndex < frame.neighbors.length) {
        const next = frame.neighbors[frame.nextIndex];
        frame.nextIndex += 1;
        if (!indexByNode.has(next)) {
          frames.push({ node: next, neighbors: null, nextIndex: 0 });
        } else if (onStack.has(next)) {
          lowLinkByNode.set(frame.node, Math.min(lowLinkByNode.get(frame.node), indexByNode.get(next)));
        }
        continue;
      }

      finishNode(frame.node);
      frames.pop();
      if (frames.length > 0) {
        const parent = frames[frames.length - 1].node;
        lowLinkByNode.set(parent, Math.min(lowLinkByNode.get(parent), lowLinkByNode.get(frame.node)));
      }
    }
  };

  for (const node of orderedNodes) {
    if (!indexByNode.has(node)) visit(node);
  }
  return components.sort((a, b) => compareLocale(a.join('\u0000'), b.join('\u0000')));
}

function moduleCycles(snapshot) {
  const modulePaths = new Set(snapshot.modules.map((module) => module.path));
  const depsByPath = new Map(snapshot.modules.map((module) => [
    module.path,
    module.localDependencies.filter((dependency) => modulePaths.has(dependency)),
  ]));
  return stronglyConnectedComponents(modulePaths, (node) => depsByPath.get(node) || [])
    .filter((component) => component.length > 1 || (depsByPath.get(component[0]) || []).includes(component[0]))
    .map((members) => ({ key: members.join('\u0000'), members }));
}

function functionComparisonMapsForCycles(base, head, functions) {
  const maps = edgeFunctionMaps(base, head, functions);
  const baseLabelByComparisonId = new Map();
  const headLabelByComparisonId = new Map();
  for (const node of base.functions) {
    const comparisonId = maps.baseComparisonIdByFunctionId.get(node.id);
    if (comparisonId) baseLabelByComparisonId.set(comparisonId, `${node.modulePath}:${node.name}`);
  }
  for (const node of head.functions) {
    const comparisonId = maps.headComparisonIdByFunctionId.get(node.id);
    if (comparisonId) headLabelByComparisonId.set(comparisonId, `${node.modulePath}:${node.name}`);
  }
  return { ...maps, baseLabelByComparisonId, headLabelByComparisonId };
}

function functionCycles(snapshot, { comparisonIdByFunctionId, labelByComparisonId }) {
  const nodes = new Set();
  const depsByComparisonId = new Map();
  for (const edge of snapshot.functionEdges) {
    const source = comparisonIdByFunctionId.get(edge.sourceId);
    const target = comparisonIdByFunctionId.get(edge.targetId);
    if (!source || !target) continue;
    nodes.add(source);
    nodes.add(target);
    if (!depsByComparisonId.has(source)) depsByComparisonId.set(source, []);
    depsByComparisonId.get(source).push(target);
  }
  return stronglyConnectedComponents(nodes, (node) => depsByComparisonId.get(node) || [])
    .filter((component) => component.length > 1 || (depsByComparisonId.get(component[0]) || []).includes(component[0]))
    .map((component) => ({
      key: component.join('\u0000'),
      members: component.map((id) => labelByComparisonId.get(id) || id).sort(compareLocale),
    }))
    .sort((a, b) => compareLocale(a.members.join('\u0000'), b.members.join('\u0000')));
}

function cycleFindings(base, head, functions) {
  const findings = [];
  const baseModuleCycleKeys = new Set(moduleCycles(base).map((cycle) => cycle.key));
  for (const cycle of moduleCycles(head)) {
    if (baseModuleCycleKeys.has(cycle.key)) continue;
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_MODULE_CYCLE_ADDED',
      semanticIdentity: {
        entityType: 'module-cycle',
        members: cycle.members,
      },
      severity: 'warning',
      confidence: 'high',
      message: `New module dependency cycle: ${cycle.members.join(' -> ')}.`,
      evidence: {
        entityType: 'module-cycle',
        members: cycle.members,
      },
      location: relativeLocation(cycle.members[0]),
    }));
  }

  const cycleMaps = functionComparisonMapsForCycles(base, head, functions);
  const baseFunctionCycleKeys = new Set(functionCycles(base, {
    comparisonIdByFunctionId: cycleMaps.baseComparisonIdByFunctionId,
    labelByComparisonId: cycleMaps.baseLabelByComparisonId,
  }).map((cycle) => cycle.key));
  for (const cycle of functionCycles(head, {
    comparisonIdByFunctionId: cycleMaps.headComparisonIdByFunctionId,
    labelByComparisonId: cycleMaps.headLabelByComparisonId,
  })) {
    if (baseFunctionCycleKeys.has(cycle.key)) continue;
    const firstMember = cycle.members[0] || '';
    findings.push(createFinding({
      ruleId: 'IRONG_DIFF_FUNCTION_CYCLE_ADDED',
      semanticIdentity: {
        entityType: 'function-cycle',
        members: cycle.members,
      },
      severity: 'warning',
      confidence: 'high',
      message: `New function dependency cycle: ${cycle.members.join(' -> ')}.`,
      evidence: {
        entityType: 'function-cycle',
        members: cycle.members,
      },
      location: relativeLocation(firstMember.split(':')[0] || null),
    }));
  }
  return findings;
}

function crossFileEdgeFindings(edges) {
  return edges.added
    .filter((edgeInfo) => edgeInfo.source.modulePath && edgeInfo.target.modulePath
      && edgeInfo.source.modulePath !== edgeInfo.target.modulePath)
    .map((edgeInfo) => createFinding({
      ruleId: 'IRONG_DIFF_CROSS_FILE_EDGE_ADDED',
      semanticIdentity: {
        entityType: 'function-edge',
        sourceStableId: edgeInfo.source.stableId,
        sourceModulePath: edgeInfo.source.modulePath,
        sourceName: edgeInfo.source.name,
        targetStableId: edgeInfo.target.stableId,
        targetModulePath: edgeInfo.target.modulePath,
        targetName: edgeInfo.target.name,
        scope: edgeInfo.scope,
        import: edgeInfo.import ? edgeImportIdentity(edgeInfo) : '',
      },
      severity: 'note',
      confidence: 'medium',
      message: `New cross-file static function edge from ${edgeInfo.source.name} to ${edgeInfo.target.name}.`,
      evidence: {
        entityType: 'function-edge',
        edge: {
          source: `${edgeInfo.source.modulePath}:${edgeInfo.source.name}`,
          target: `${edgeInfo.target.modulePath}:${edgeInfo.target.name}`,
          scope: edgeInfo.scope,
          relationKind: edgeInfo.relationKind,
          referenceCount: edgeInfo.referenceCount,
        },
      },
      location: relativeLocation(edgeInfo.source.modulePath, edgeInfo.source.location?.startLine, edgeInfo.source.location?.endLine),
    }));
}

function countFanByComparisonId(snapshot, comparisonIdByFunctionId) {
  const fanIn = new Map();
  const fanOut = new Map();
  for (const edge of snapshot.functionEdges) {
    const source = comparisonIdByFunctionId.get(edge.sourceId);
    const target = comparisonIdByFunctionId.get(edge.targetId);
    if (!source || !target) continue;
    fanOut.set(source, (fanOut.get(source) || 0) + 1);
    fanIn.set(target, (fanIn.get(target) || 0) + 1);
  }
  return { fanIn, fanOut };
}

function isMaterialFanIncrease(baseCount, headCount) {
  const delta = headCount - baseCount;
  if (delta < FAN_INCREASE_THRESHOLD.minimumDelta) return false;
  if (baseCount === 0) return headCount >= FAN_INCREASE_THRESHOLD.minimumDelta;
  return headCount >= baseCount * FAN_INCREASE_THRESHOLD.minimumRatio;
}

function fanIncreaseFindings(base, head, functions) {
  const maps = edgeFunctionMaps(base, head, functions);
  const baseCounts = countFanByComparisonId(base, maps.baseComparisonIdByFunctionId);
  const headCounts = countFanByComparisonId(head, maps.headComparisonIdByFunctionId);
  const findings = [];

  for (const match of functions.matches) {
    const comparisonId = comparisonIdForPair(match.base.stableId, match.head.stableId);
    for (const metric of ['fanIn', 'fanOut']) {
      const baseCount = baseCounts[metric].get(comparisonId) || 0;
      const headCount = headCounts[metric].get(comparisonId) || 0;
      if (!isMaterialFanIncrease(baseCount, headCount)) continue;
      findings.push(createFinding({
        ruleId: 'IRONG_DIFF_FAN_INCREASE',
        semanticIdentity: {
          entityType: 'function',
          functionStableId: match.head.stableId,
          modulePath: match.head.modulePath,
          name: match.head.name,
          metric,
        },
        severity: 'warning',
        confidence: 'medium',
        message: `${metric} for ${match.head.name} materially increased in the static function graph.`,
        evidence: {
          entityType: 'function',
          metric,
          function: {
            stableId: match.head.stableId,
            modulePath: match.head.modulePath,
            name: match.head.name,
          },
          counts: {
            base: baseCount,
            head: headCount,
            delta: headCount - baseCount,
          },
          threshold: FAN_INCREASE_THRESHOLD,
        },
        location: relativeLocation(match.head.modulePath, match.head.startLine, match.head.endLine),
      }));
    }
  }
  return findings;
}

function frontEndRecordKey(record, fields) {
  return fields.map((field) => utils_normalizeString(record?.[field]).trim()).join('\u0000');
}

function addedFrontEndRecords(baseRecords, headRecords, fields) {
  const baseKeys = new Set(baseRecords.map((record) => frontEndRecordKey(record, fields)));
  return headRecords.filter((record) => !baseKeys.has(frontEndRecordKey(record, fields)));
}

function removedFrontEndRecords(baseRecords, headRecords, fields) {
  const headKeys = new Set(headRecords.map((record) => frontEndRecordKey(record, fields)));
  return baseRecords.filter((record) => !headKeys.has(frontEndRecordKey(record, fields)));
}

function frontEndImportFindings(base, head) {
  return [
    ...addedFrontEndRecords(
      base.browserIncompatibleImports,
      head.browserIncompatibleImports,
      ['sourceModulePath', 'specifier', 'loadKind'],
    ).map((item) => createFinding({
      ruleId: 'IRONG_DIFF_BROWSER_INCOMPATIBLE_IMPORT_ADDED',
      semanticIdentity: {
        entityType: 'browser-incompatible-import',
        sourceModulePath: item.sourceModulePath,
        specifier: item.specifier,
        loadKind: item.loadKind,
      },
      severity: 'error',
      confidence: 'high',
      message: `Browser-incompatible Node builtin import "${item.specifier}" was added to reachable browser module ${item.sourceModulePath}.`,
      evidence: { entityType: 'browser-incompatible-import', import: item },
      location: relativeLocation(item.sourceModulePath),
    })),
    ...addedFrontEndRecords(
      base.unresolvedImports,
      head.unresolvedImports,
      ['sourceModulePath', 'specifier', 'loadKind'],
    ).map((item) => createFinding({
      ruleId: 'IRONG_DIFF_UNRESOLVED_IMPORT_ADDED',
      semanticIdentity: {
        entityType: 'unresolved-import',
        sourceModulePath: item.sourceModulePath,
        specifier: item.specifier,
        loadKind: item.loadKind,
      },
      severity: 'error',
      confidence: 'high',
      message: `Unresolved import "${item.specifier}" was added to reachable browser module ${item.sourceModulePath}.`,
      evidence: { entityType: 'unresolved-import', import: item },
      location: relativeLocation(item.sourceModulePath),
    })),
    ...addedFrontEndRecords(
      base.remoteImports,
      head.remoteImports,
      ['sourceModulePath', 'specifier', 'loadKind'],
    ).map((item) => createFinding({
      ruleId: 'IRONG_DIFF_REMOTE_IMPORT_ADDED',
      semanticIdentity: {
        entityType: 'remote-import',
        sourceModulePath: item.sourceModulePath,
        specifier: item.specifier,
        loadKind: item.loadKind,
      },
      severity: 'warning',
      confidence: 'high',
      message: `Remote import "${item.specifier}" was added to reachable browser module ${item.sourceModulePath}.`,
      evidence: { entityType: 'remote-import', import: item },
      location: relativeLocation(item.sourceModulePath),
    })),
  ];
}

function routeRemovalFindings(base, head) {
  return removedFrontEndRecords(base.routes, head.routes, ['path', 'component', 'adapter'])
    .map((route) => createFinding({
      ruleId: 'IRONG_DIFF_ROUTE_REMOVED',
      semanticIdentity: {
        entityType: 'route',
        path: route.path,
        component: route.component,
        adapter: route.adapter,
      },
      severity: 'warning',
      confidence: 'medium',
      message: `Route "${route.path || '(index)'}" was removed from saved ${route.adapter || 'route'} evidence.`,
      evidence: { entityType: 'route', route },
      location: relativeLocation(route.modulePath),
    }));
}

function lazyBoundaryFindings(base, head) {
  const added = addedFrontEndRecords(base.lazyBoundaries, head.lazyBoundaries, [
    'sourceModulePath',
    'targetModulePath',
    'specifier',
    'kind',
  ]);
  const removed = removedFrontEndRecords(base.lazyBoundaries, head.lazyBoundaries, [
    'sourceModulePath',
    'targetModulePath',
    'specifier',
    'kind',
  ]);
  return [
    ...added.map((boundary) => ({ ...boundary, change: 'added' })),
    ...removed.map((boundary) => ({ ...boundary, change: 'removed' })),
  ].map((boundary) => createFinding({
    ruleId: 'IRONG_DIFF_LAZY_BOUNDARY_CHANGED',
    semanticIdentity: {
      entityType: 'lazy-boundary',
      sourceModulePath: boundary.sourceModulePath,
      targetModulePath: boundary.targetModulePath,
      specifier: boundary.specifier,
      kind: boundary.kind,
      change: boundary.change,
    },
    severity: 'warning',
    confidence: 'medium',
    message: `Lazy boundary ${boundary.change}: ${boundary.sourceModulePath} -> ${boundary.specifier}.`,
    evidence: { entityType: 'lazy-boundary', boundary },
    location: relativeLocation(boundary.sourceModulePath),
  }));
}

function entryGrowthFindings(base, head) {
  const baseReachable = base.modules.filter((module) => module.reachable === true);
  const headReachable = head.modules.filter((module) => module.reachable === true);
  const baseLines = baseReachable.reduce((total, module) => total + (module.lineCount || 0), 0);
  const headLines = headReachable.reduce((total, module) => total + (module.lineCount || 0), 0);
  const moduleDelta = headReachable.length - baseReachable.length;
  const lineDelta = headLines - baseLines;
  if (moduleDelta < 3 && lineDelta < 200) return [];
  return [createFinding({
    ruleId: 'IRONG_DIFF_ENTRY_GROWTH',
    semanticIdentity: {
      entityType: 'entry-growth',
      entry: head.entry || '',
      moduleDelta,
      lineBucket: Math.floor(Math.max(0, lineDelta) / 100),
    },
    severity: 'warning',
    confidence: 'medium',
    message: `Reachable browser entry grew by ${moduleDelta} modules and ${lineDelta} source lines in the static snapshot.`,
    evidence: {
      entityType: 'entry-growth',
      base: { reachableModules: baseReachable.length, reachableLines: baseLines },
      head: { reachableModules: headReachable.length, reachableLines: headLines },
      delta: { modules: moduleDelta, lines: lineDelta },
    },
    location: relativeLocation(head.entry),
  })];
}

function componentCycles(snapshot) {
  const nodes = new Set();
  const depsByNode = new Map();
  for (const edge of snapshot.componentEdges || []) {
    const source = `${edge.sourceModulePath}:${edge.sourceComponent}`;
    const target = edge.targetModulePath
      ? `${edge.targetModulePath}:${edge.targetComponent}`
      : '';
    if (!source || !target) continue;
    nodes.add(source);
    nodes.add(target);
    if (!depsByNode.has(source)) depsByNode.set(source, []);
    depsByNode.get(source).push(target);
  }
  return stronglyConnectedComponents(nodes, (node) => depsByNode.get(node) || [])
    .filter((component) => component.length > 1 || (depsByNode.get(component[0]) || []).includes(component[0]))
    .map((members) => ({ key: members.join('\u0000'), members }))
    .sort((a, b) => compareLocale(a.key, b.key));
}

function componentCycleFindings(base, head) {
  const baseCycleKeys = new Set(componentCycles(base).map((cycle) => cycle.key));
  return componentCycles(head)
    .filter((cycle) => !baseCycleKeys.has(cycle.key))
    .map((cycle) => createFinding({
      ruleId: 'IRONG_DIFF_COMPONENT_CYCLE_ADDED',
      semanticIdentity: {
        entityType: 'component-cycle',
        members: cycle.members,
      },
      severity: 'warning',
      confidence: 'medium',
      message: `New component render cycle: ${cycle.members.join(' -> ')}.`,
      evidence: { entityType: 'component-cycle', members: cycle.members },
      location: relativeLocation(cycle.members[0]?.split(':')[0] || null),
    }));
}

function browserApiFindings(base, head) {
  return addedFrontEndRecords(base.browserApis, head.browserApis, ['modulePath', 'api', 'name'])
    .map((item) => createFinding({
      ruleId: 'IRONG_DIFF_BROWSER_API_ADDED',
      semanticIdentity: {
        entityType: 'browser-api',
        modulePath: item.modulePath,
        api: item.api,
        name: item.name,
      },
      severity: 'note',
      confidence: 'medium',
      message: `Browser API reference ${item.name || item.api} was added in ${item.modulePath}.`,
      evidence: { entityType: 'browser-api', api: item },
      location: relativeLocation(item.modulePath, item.line),
    }));
}

function compareFindings(a, b) {
  return (diff_snapshots_SEVERITY_ORDER.get(a.severity) ?? 99) - (diff_snapshots_SEVERITY_ORDER.get(b.severity) ?? 99)
    || (RULE_ORDER.get(a.ruleId) ?? 99) - (RULE_ORDER.get(b.ruleId) ?? 99)
    || (ENTITY_ORDER.get(a.evidence?.entityType) ?? 99) - (ENTITY_ORDER.get(b.evidence?.entityType) ?? 99)
    || compareLocale(a.location?.path || '', b.location?.path || '')
    || compareLocale(a.message, b.message)
    || compareLocale(a.id, b.id);
}

function buildFindings({ base, head, modules, functions, edges }) {
  return [
    ...frontEndImportFindings(base, head),
    ...routeRemovalFindings(base, head),
    ...lazyBoundaryFindings(base, head),
    ...entryGrowthFindings(base, head),
    ...componentCycleFindings(base, head),
    ...browserApiFindings(base, head),
    ...exportFindings(functions),
    ...reachabilityFindings(modules, functions),
    ...cycleFindings(base, head, functions),
    ...crossFileEdgeFindings(edges),
    ...fanIncreaseFindings(base, head, functions),
  ].sort(compareFindings);
}

function findingsBySeverity(findings) {
  return {
    error: findings.filter((finding) => finding.severity === 'error').length,
    warning: findings.filter((finding) => finding.severity === 'warning').length,
    note: findings.filter((finding) => finding.severity === 'note').length,
  };
}

function buildDiff(base, head, options) {
  const modules = compareModules(base, head);
  const functions = compareFunctions(base, head);
  const edges = compareEdges(base, head, functions);
  const findings = buildFindings({ base, head, modules, functions, edges });
  const publicFunctions = {
    added: functions.added,
    removed: functions.removed,
    changed: functions.changed,
    moves: functions.moves,
    renames: functions.renames,
  };
  return {
    schemaVersion: DIFF_SCHEMA_VERSION,
    generatedAt: options.generatedAt ?? null,
    base: snapshotIdentity(base, options.baseLabel || 'base'),
    head: snapshotIdentity(head, options.headLabel || 'head'),
    privacy: {
      sourceMode: 'none',
      excludes: ['absolute rootDir', 'baseline path', 'suppression path', 'source text'],
    },
    limitations: Array.from(new Set([...base.limitations, ...head.limitations])).sort(compareLocale),
    summary: {
      modules: collectionCounts(modules),
      functions: {
        ...collectionCounts(functions),
        moves: functions.moves.length,
        renames: functions.renames.length,
      },
      edges: collectionCounts(edges),
      deltas: {
        additions: modules.added.length + functions.added.length + edges.added.length,
        removals: modules.removed.length + functions.removed.length + edges.removed.length,
        changes: modules.changed.length + functions.changed.length + edges.changed.length,
        moves: functions.moves.length,
        renames: functions.renames.length,
      },
      reachable: {
        modules: {
          base: base.modules.filter((module) => module.reachable === true).length,
          head: head.modules.filter((module) => module.reachable === true).length,
          delta: head.modules.filter((module) => module.reachable === true).length
            - base.modules.filter((module) => module.reachable === true).length,
        },
        functions: {
          base: base.functions.filter((node) => node.reachable === true).length,
          head: head.functions.filter((node) => node.reachable === true).length,
          delta: head.functions.filter((node) => node.reachable === true).length
            - base.functions.filter((node) => node.reachable === true).length,
        },
      },
      findingsBySeverity: {
        ...findingsBySeverity(findings),
      },
    },
    modules,
    functions: publicFunctions,
    edges,
    findings,
    id: `diff_${stableHash({
      base: snapshotIdentity(base, options.baseLabel || 'base'),
      head: snapshotIdentity(head, options.headLabel || 'head'),
    })}`,
  };
}

function compareSnapshots(baseSnapshot, headSnapshot, options = {}) {
  const base = normalizeSnapshot(baseSnapshot, 'base');
  const head = normalizeSnapshot(headSnapshot, 'head');
  if (base.meta.schemaVersion !== head.meta.schemaVersion) {
    throw new diff_snapshots_SnapshotDiffError('Snapshot schema versions are incompatible.', 'incompatible_snapshot');
  }
  return applyReviewPolicy(buildDiff(base, head, options));
}

function escapeHtml(value) {
  return utils_normalizeString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderStat(label, value) {
  return `<div class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function reviewStateLabel(value) {
  return value === 'existing' ? 'Existing' : 'New';
}

function renderReviewActionBadge(review = {}) {
  if (review.suppressed) return '<span class="badge suppressed">Suppressed</span>';
  if (review.baselineState === 'new') return '<span class="badge actionable">Actionable</span>';
  return '<span class="badge">Accepted baseline</span>';
}

function renderReviewPolicy(policy = {}) {
  const findings = policy.findings || {};
  const gateText = policy.gateTriggered ? 'Gate triggered' : 'Gate clear';
  const failOn = policy.failOn || 'off';
  const gateIds = Array.isArray(policy.gateFindingIds) ? policy.gateFindingIds : [];
  return [
    '<section>',
    '<h2>Review Gate</h2>',
    '<div class="summary">',
    renderStat('Gate', gateText),
    renderStat('Fail on', failOn),
    renderStat('Baseline findings', policy.baselineProvided ? policy.baselineFindingCount || 0 : 'none'),
    renderStat('Suppressions', `${policy.suppressionCount || 0} total, ${policy.unusedSuppressionCount || 0} unused`),
    renderStat('Review states', `${findings.new || 0} new, ${findings.existing || 0} existing, ${findings.suppressed || 0} suppressed`),
    renderStat('Actionable findings', findings.actionable || 0),
    '</div>',
    gateIds.length
      ? `<p class="muted">Gate finding IDs: ${escapeHtml(gateIds.join(', '))}</p>`
      : '<p class="muted">No gate-triggering findings.</p>',
    '</section>',
  ].join('');
}

function renderIdentity(label, identity = {}) {
  return [
    '<dl class="identity">',
    `<dt>${escapeHtml(label)}</dt>`,
    `<dd>${escapeHtml(identity.label || '')}</dd>`,
    '<dt>Entry</dt>',
    `<dd>${escapeHtml(identity.entry || 'unknown')}</dd>`,
    '<dt>Schema</dt>',
    `<dd>${escapeHtml(identity.schemaVersion || 'unknown')}</dd>`,
    '<dt>Build</dt>',
    `<dd>${escapeHtml(identity.buildId || 'unknown')}</dd>`,
    '<dt>Git</dt>',
    `<dd>${escapeHtml(identity.gitCommit || 'unknown')}</dd>`,
    '</dl>',
  ].join('');
}

function renderChangeList(changes = []) {
  if (!changes.length) return '<p class="muted">No field-level changes.</p>';
  return `<ul>${changes.map((change) => (
    `<li><code>${escapeHtml(change.field)}</code></li>`
  )).join('')}</ul>`;
}

function renderFinding(finding) {
  const location = finding.location?.path
    ? `${finding.location.path}${finding.location.startLine ? `:${finding.location.startLine}` : ''}`
    : 'No location';
  const review = finding.review || { baselineState: 'new', suppressed: false };
  return [
    '<article class="finding">',
    `<h4>${escapeHtml(finding.ruleId)} <span>${escapeHtml(finding.severity)}</span></h4>`,
    '<p class="badges">',
    `<span class="badge">${escapeHtml(reviewStateLabel(review.baselineState))}</span>`,
    renderReviewActionBadge(review),
    '</p>',
    `<p>${escapeHtml(finding.message)}</p>`,
    `<p class="muted">${escapeHtml(location)} · confidence ${escapeHtml(finding.confidence)}</p>`,
    review.suppressed
      ? `<p class="muted"><strong>Suppression reason:</strong> ${escapeHtml(review.suppressionReason || '')}</p>`
      : '',
    '<details>',
    '<summary>Evidence</summary>',
    `<pre>${escapeHtml(JSON.stringify(finding.evidence, null, 2))}</pre>`,
    '</details>',
    '</article>',
  ].join('');
}

function renderFindings(findings = []) {
  if (!findings.length) return '<p class="muted">No structural findings.</p>';
  const groups = new Map();
  for (const finding of findings) {
    const key = `${finding.severity}\u0000${finding.ruleId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(finding);
  }
  return Array.from(groups, ([key, group]) => {
    const [severity, ruleId] = key.split('\u0000');
    return [
      '<details open class="group">',
      `<summary>${escapeHtml(severity)} · ${escapeHtml(ruleId)} (${group.length})</summary>`,
      group.map(renderFinding).join(''),
      '</details>',
    ].join('');
  }).join('');
}

function renderModules(modules = {}) {
  return [
    '<details open><summary>Modules</summary>',
    '<div class="columns">',
    renderNamedList('Added', modules.added, (item) => `${item.path} (${item.lineCount} lines)`),
    renderNamedList('Removed', modules.removed, (item) => `${item.path} (${item.lineCount} lines)`),
    renderNamedList('Changed', modules.changed, (item) => `${item.path}: ${item.changedFields.join(', ')}`),
    '</div>',
    '</details>',
  ].join('');
}

function renderFunctions(functions = {}) {
  return [
    '<details open><summary>Functions</summary>',
    '<div class="columns">',
    renderNamedList('Added', functions.added, (item) => `${item.modulePath}:${item.name}`),
    renderNamedList('Removed', functions.removed, (item) => `${item.modulePath}:${item.name}`),
    renderNamedList('Changed', functions.changed, (item) => (
      `${item.base.modulePath}:${item.base.name} -> ${item.head.modulePath}:${item.head.name} (${item.matchKind}, ${item.confidence})`
    ), renderChangeList),
    '</div>',
    '</details>',
  ].join('');
}

function renderEdges(edges = {}) {
  return [
    '<details open><summary>Function Edges</summary>',
    '<div class="columns">',
    renderNamedList('Added', edges.added, (item) => `${item.source.modulePath}:${item.source.name} -> ${item.target.modulePath}:${item.target.name}`),
    renderNamedList('Removed', edges.removed, (item) => `${item.source.modulePath}:${item.source.name} -> ${item.target.modulePath}:${item.target.name}`),
    renderNamedList('Changed', edges.changed, (item) => (
      `${item.base.source.modulePath}:${item.base.source.name} -> ${item.base.target.modulePath}:${item.base.target.name}: ${item.changedFields.join(', ')}`
    )),
    '</div>',
    '</details>',
  ].join('');
}

function renderNamedList(title, items = [], labelForItem, detailForItem = null) {
  const rows = items.length
    ? items.map((item) => [
      '<li>',
      `<span>${escapeHtml(labelForItem(item))}</span>`,
      detailForItem ? detailForItem(item.changes || []) : '',
      '</li>',
    ].join('')).join('')
    : '<li class="muted">None</li>';
  return `<section class="list"><h3>${escapeHtml(title)}</h3><ul>${rows}</ul></section>`;
}

function renderDiffHtml(diff = {}) {
  const summary = diff.summary || {};
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>IronGlancer Architecture Diff</title>',
    '<style>',
    ':root{color-scheme:light;--ink:#17202a;--muted:#5b6673;--line:#d8dee4;--paper:#fff;--band:#f6f8fa;--accent:#0f766e;--error:#b42318;--warning:#a15c07;--note:#175cd3;}',
    '*{box-sizing:border-box}body{margin:0;font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:var(--paper)}',
    'header{padding:28px max(20px,5vw);background:var(--band);border-bottom:1px solid var(--line)}main{padding:24px max(20px,5vw);display:grid;gap:24px}',
    'h1{margin:0 0 8px;font-size:clamp(24px,3vw,38px)}h2{margin:0 0 12px;font-size:20px}h3{margin:0 0 8px;font-size:15px}h4{margin:0 0 6px;font-size:14px}',
    '.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}.stat{border:1px solid var(--line);border-radius:8px;padding:12px;background:#fff}.stat span{display:block;color:var(--muted);font-size:12px}.stat strong{font-size:22px}',
    '.identities{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}.identity{display:grid;grid-template-columns:72px 1fr;gap:6px 10px;margin:0}.identity dt{color:var(--muted)}.identity dd{margin:0;overflow-wrap:anywhere}',
    'details{border:1px solid var(--line);border-radius:8px;background:#fff;padding:12px}summary{cursor:pointer;font-weight:700}.group{margin-bottom:10px}.finding{border-top:1px solid var(--line);padding-top:10px;margin-top:10px}.finding h4 span{font-weight:600;color:var(--muted)}',
    '.badges{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 6px}.badge{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;padding:2px 8px;font-size:12px;font-weight:700;background:var(--band)}.badge.suppressed{border-color:#7c3aed;color:#5b21b6}.badge.actionable{border-color:#0f766e;color:#0f766e}',
    '.columns{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.list ul{margin:0;padding-left:18px}.list li{margin:6px 0;overflow-wrap:anywhere}.muted{color:var(--muted)}code,pre{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}pre{white-space:pre-wrap;background:var(--band);padding:10px;border-radius:6px;overflow:auto}',
    '</style>',
    '</head>',
    '<body>',
    '<header>',
    '<h1>IronGlancer Architecture Diff</h1>',
    `<p class="muted">Generated ${escapeHtml(diff.generatedAt || 'unknown')} · sourceMode ${escapeHtml(diff.privacy?.sourceMode || 'none')}</p>`,
    '</header>',
    '<main>',
    '<section>',
    '<h2>Executive Summary</h2>',
    '<div class="summary">',
    renderStat('Module changes', `${summary.modules?.added || 0}+ / ${summary.modules?.removed || 0}- / ${summary.modules?.changed || 0} changed`),
    renderStat('Function changes', `${summary.functions?.added || 0}+ / ${summary.functions?.removed || 0}- / ${summary.functions?.changed || 0} changed`),
    renderStat('Moves / renames', `${summary.functions?.moves || 0} / ${summary.functions?.renames || 0}`),
    renderStat('Edge changes', `${summary.edges?.added || 0}+ / ${summary.edges?.removed || 0}- / ${summary.edges?.changed || 0} changed`),
    renderStat('Findings', `${summary.findingsBySeverity?.error || 0} errors, ${summary.findingsBySeverity?.warning || 0} warnings, ${summary.findingsBySeverity?.note || 0} notes`),
    '</div>',
    '</section>',
    renderReviewPolicy(diff.reviewPolicy || {}),
    '<section>',
    '<h2>Snapshot Identity</h2>',
    '<div class="identities">',
    renderIdentity('Base', diff.base),
    renderIdentity('Head', diff.head),
    '</div>',
    '</section>',
    '<section><h2>Findings</h2>',
    renderFindings(diff.findings || []),
    '</section>',
    '<section><h2>Changes</h2>',
    renderModules(diff.modules),
    renderFunctions(diff.functions),
    renderEdges(diff.edges),
    '</section>',
    '<section><h2>Static-analysis limitations</h2>',
    `<ul>${(diff.limitations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`,
    `<p class="muted">Privacy: ${escapeHtml((diff.privacy?.excludes || []).join(', '))}; no source excerpts are included.</p>`,
    '</section>',
    '</main>',
    '</body>',
    '</html>',
  ].join('');
}

function safeArtifactUri(value) {
  const portablePath = utils_normalizeString(value)
    .replace(/\\/g, '/')
    .replace(/^[A-Za-z]:\//, '')
    .replace(/^\/+/, '')
    .replace(/(?:^|\/)\.\.(?=\/|$)/g, '')
    .trim();
  if (!portablePath || /[\u0000-\u001f\u007f]/.test(portablePath)) return '';
  try {
    return portablePath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  } catch {
    return '';
  }
}

function sarifRegion(location = {}) {
  const region = {};
  if (Number.isInteger(location.startLine)) region.startLine = location.startLine;
  if (Number.isInteger(location.endLine)) region.endLine = location.endLine;
  return Object.keys(region).length > 0 ? region : null;
}

function sarifLocation(location = {}) {
  const uri = safeArtifactUri(location.path);
  if (!uri) return null;
  const physicalLocation = {
    artifactLocation: { uri },
  };
  const region = sarifRegion(location);
  if (region) physicalLocation.region = region;
  return { physicalLocation };
}

function sarifLevel(severity) {
  if (severity === 'error') return 'error';
  if (severity === 'warning') return 'warning';
  return 'note';
}

function renderDiffSarif(diff = {}) {
  const rules = RULE_DEFINITIONS.map((rule) => ({
    id: rule.id,
    name: rule.name,
    shortDescription: { text: rule.shortDescription },
    help: { text: rule.help, markdown: rule.help },
    properties: {
      category: 'architecture-diff',
    },
  }));
  const ruleIndexById = new Map(rules.map((rule, index) => [rule.id, index]));
  const results = (Array.isArray(diff.findings) ? diff.findings : []).map((finding) => {
    const location = sarifLocation(finding.location);
    const review = finding.review || { baselineState: 'new', suppressed: false };
    return {
      ruleId: finding.ruleId,
      ruleIndex: ruleIndexById.get(finding.ruleId) ?? -1,
      level: sarifLevel(finding.severity),
      baselineState: review.baselineState === 'existing' ? 'unchanged' : 'new',
      message: { text: utils_normalizeString(finding.message) },
      ...(location ? { locations: [location] } : {}),
      ...(review.suppressed ? {
        suppressions: [{
          kind: 'external',
          justification: utils_normalizeString(review.suppressionReason),
        }],
      } : {}),
      properties: {
        id: finding.id,
        severity: finding.severity,
        confidence: finding.confidence,
        evidence: finding.evidence || {},
        review,
      },
    };
  });
  return {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [{
      tool: {
        driver: {
          name: 'IronGlancer',
          informationUri: 'https://github.com/karpatic/ironglancer',
          rules,
        },
      },
      invocations: [{
        executionSuccessful: true,
        properties: {
          diffSchemaVersion: diff.schemaVersion || DIFF_SCHEMA_VERSION,
          base: diff.base || {},
          head: diff.head || {},
          privacy: diff.privacy || { sourceMode: 'none' },
          limitations: diff.limitations || [],
          reviewPolicy: diff.reviewPolicy || {},
        },
      }],
      results,
    }],
  };
}

;// CONCATENATED MODULE: ./src/lib/import-parser.js


function splitImportBindingParts(text) {
  return normalizeString(text)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeJsIdentifier(value) {
  const raw = utils_normalizeString(value).trim();
  const match = raw.match(/[A-Za-z_$][A-Za-z0-9_$]*/);
  return match ? match[0] : '';
}

function normalizeImportSpecifierName(value) {
  return normalizeJsIdentifier(normalizeString(value).trim().replace(/^(?:type|typeof)\s+/, ''));
}

function importBindingKind(imported) {
  return imported === 'default' ? 'default' : 'named';
}

function parseNamedImportBindingMetadata(text, { destructured = false, inferred = false } = {}) {
  const names = [];
  for (const part of splitImportBindingParts(text)) {
    const cleaned = part
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/g, '')
      .trim();
    if (!cleaned) continue;
    const aliasMatch = destructured
      ? cleaned.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*$/)
      : cleaned.match(/^(?:(?:type|typeof)\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*$/);
    const imported = aliasMatch ? aliasMatch[1] : normalizeImportSpecifierName(cleaned);
    const local = aliasMatch ? aliasMatch[2] : imported;
    if (imported && local) {
      names.push({ imported, local, kind: importBindingKind(imported), inferred });
    }
  }
  return names;
}

function parseStaticImportBindings(clause) {
  const text = normalizeString(clause).trim().replace(/^(?:type|typeof)\s+/, '');
  if (!text) return [];
  const bindings = [];
  const defaultPart = text
    .replace(/\{[\s\S]*?\}/g, '')
    .replace(/\*\s+as\s+[A-Za-z_$][A-Za-z0-9_$]*/g, '')
    .split(',')
    .map((part) => normalizeJsIdentifier(part))
    .find(Boolean);
  if (defaultPart) {
    bindings.push({ imported: 'default', local: defaultPart, kind: 'default', inferred: false });
  }
  const namespaceMatch = text.match(/\*\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
  if (namespaceMatch) {
    bindings.push({ imported: '*', local: namespaceMatch[1], kind: 'namespace', inferred: false });
  }
  const namedMatch = text.match(/\{([\s\S]*?)\}/);
  if (namedMatch) bindings.push(...parseNamedImportBindingMetadata(namedMatch[1]));
  return bindings;
}

function parseDynamicImportBindings(binding) {
  const text = normalizeString(binding).trim();
  if (!text) return [];
  const destructured = text.match(/^\{([\s\S]*?)\}$/);
  if (destructured) return parseNamedImportBindingMetadata(destructured[1], { destructured: true });
  const name = normalizeJsIdentifier(text);
  return name ? [{ imported: '*', local: name, kind: 'namespace', inferred: false }] : [];
}

function unescapeStringLiteralValue(value) {
  return normalizeString(value).replace(/\\(['"\\])/g, '$1');
}

function startsInCode(maskedText, index) {
  return index >= 0 && /\S/.test(maskedText[index] || '');
}

function collectStringConstants(source, maskedSource = maskIgnorableSyntax(source)) {
  const text = normalizeString(source);
  const masked = normalizeString(maskedSource);
  const constants = new Map();
  const stringConstantPattern = /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(['"])((?:\\.|(?!\2)[\s\S])*?)\2/g;
  let match;
  while ((match = stringConstantPattern.exec(text))) {
    if (!startsInCode(masked, match.index)) continue;
    constants.set(match[1], unescapeStringLiteralValue(match[3]));
  }
  return constants;
}

function resolveSpecifierExpression(expression, constants) {
  const text = normalizeString(expression).trim();
  if (!text) return '';
  const literalMatch = text.match(/^(['"])((?:\\.|(?!\1)[\s\S])*?)\1$/);
  if (literalMatch) return unescapeStringLiteralValue(literalMatch[2]);
  const identifierMatch = text.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
  if (identifierMatch) return constants.get(text) || '';
  return '';
}

function normalizeImportBinding(binding) {
  const kind = normalizeString(binding?.kind || 'named').trim() || 'named';
  const imported = kind === 'namespace'
    ? '*'
    : kind === 'default'
      ? 'default'
      : normalizeJsIdentifier(binding?.imported);
  const local = normalizeJsIdentifier(binding?.local);
  if (!imported || !local) return null;
  return {
    imported,
    local,
    kind,
    inferred: Boolean(binding?.inferred),
  };
}

function pushImportRef(refs, ref) {
  const specifier = normalizeString(ref?.specifier).trim();
  if (!specifier) return;
  const bindings = (Array.isArray(ref.bindings) ? ref.bindings : [])
    .map((binding) => normalizeImportBinding(binding))
    .filter(Boolean);
  const seenBindings = new Set();
  refs.push({
    specifier,
    bindings: bindings.filter((binding) => {
      const key = `${binding.kind}\u0000${binding.imported}\u0000${binding.local}\u0000${binding.inferred}`;
      if (seenBindings.has(key)) return false;
      seenBindings.add(key);
      return true;
    }),
    kind: normalizeString(ref.kind || 'import').trim() || 'import',
  });
}

function extractImportRefs(source) {
  const imports = new Set();
  const text = normalizeString(source);
  const masked = maskIgnorableSyntax(text);
  const constants = collectStringConstants(text, masked);
  const refs = [];
  const specifierExpression = `(?:['"](?:\\\\.|[^'"])*['"]|[A-Za-z_$][A-Za-z0-9_$]*)`;
  const staticImportPattern = /\bimport\s+(?!['"])([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  const sideEffectImportPattern = /\bimport\s+['"]([^'"]+)['"]/g;
  const exportFromPattern = /\bexport\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  const assignedDynamicImportPattern = new RegExp(`\\b(?:const|let|var)\\s+(\\{[^}]*\\}|[A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*await\\s+(?:import|window\\.import)\\s*\\(\\s*(${specifierExpression})\\s*\\)`, 'g');
  const dynamicImportPattern = new RegExp(`\\b(?:import|window\\.import)\\s*\\(\\s*(${specifierExpression})\\s*\\)`, 'g');
  const lazyImportPattern = new RegExp(`\\b(?:const|let|var)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*(?:React\\.)?lazy\\s*\\(\\s*(?:async\\s*)?\\(\\s*\\)\\s*=>\\s*(?:import|window\\.import)\\s*\\(\\s*(${specifierExpression})\\s*\\)\\s*\\)`, 'g');

  const mark = (specifier) => {
    const value = normalizeString(specifier).trim();
    if (value) imports.add(value);
    return value;
  };

  let match;
  while ((match = staticImportPattern.exec(text))) {
    if (!startsInCode(masked, match.index)) continue;
    const specifier = mark(match[2]);
    pushImportRef(refs, {
      specifier,
      bindings: parseStaticImportBindings(match[1]),
      kind: 'static',
    });
  }
  while ((match = sideEffectImportPattern.exec(text))) {
    if (!startsInCode(masked, match.index)) continue;
    const specifier = mark(match[1]);
    pushImportRef(refs, { specifier, kind: 'side-effect' });
  }
  while ((match = exportFromPattern.exec(text))) {
    if (!startsInCode(masked, match.index)) continue;
    const specifier = mark(match[1]);
    pushImportRef(refs, { specifier, kind: 'export' });
  }
  while ((match = assignedDynamicImportPattern.exec(text))) {
    if (!startsInCode(masked, match.index)) continue;
    const specifier = mark(resolveSpecifierExpression(match[2], constants));
    pushImportRef(refs, {
      specifier,
      bindings: parseDynamicImportBindings(match[1]),
      kind: 'dynamic',
    });
  }
  while ((match = dynamicImportPattern.exec(text))) {
    if (!startsInCode(masked, match.index)) continue;
    const specifier = mark(resolveSpecifierExpression(match[1], constants));
    pushImportRef(refs, { specifier, kind: 'dynamic' });
  }
  while ((match = lazyImportPattern.exec(text))) {
    if (!startsInCode(masked, match.index)) continue;
    const specifier = mark(resolveSpecifierExpression(match[2], constants));
    pushImportRef(refs, {
      specifier,
      bindings: [
        {
          imported: 'default',
          local: match[1],
          kind: 'default',
          inferred: false,
        },
      ],
      kind: 'lazy',
    });
  }

  const seen = new Set();
  const refsWithBindings = new Set(refs
    .filter((ref) => ref.bindings.length > 0)
    .map((ref) => `${ref.kind}\u0000${ref.specifier}`));
  return refs.filter((ref) => {
    if (!imports.has(ref.specifier)) return false;
    if (ref.bindings.length === 0 && refsWithBindings.has(`${ref.kind}\u0000${ref.specifier}`)) return false;
    const bindingKey = ref.bindings
      .map((binding) => `${binding.kind}\u0002${binding.imported}\u0002${binding.local}\u0002${binding.inferred}`)
      .join('\u0001');
    const key = `${ref.kind}\u0000${ref.specifier}\u0000${bindingKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function preserveNewlinesAsSpaces(chars, start, end) {
  for (let index = start; index < end; index += 1) {
    if (chars[index] !== '\n' && chars[index] !== '\r') chars[index] = ' ';
  }
}

function maskQuotedText(chars, text, start, quote) {
  let index = start + 1;
  let end = -1;
  while (index < text.length) {
    if (text[index] === '\\') {
      index += 2;
      continue;
    }
    if (text[index] === quote) {
      end = index;
      index += 1;
      break;
    }
    index += 1;
  }
  preserveNewlinesAsSpaces(chars, start + 1, end === -1 ? text.length : end);
  return index;
}

function maskTemplateExpression(chars, text, start) {
  let index = start;
  let depth = 1;
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '/' && next === '/') {
      index = maskLineComment(chars, text, index);
    } else if (char === '/' && next === '*') {
      index = maskBlockComment(chars, text, index);
    } else if (char === '/' && isRegexLiteralStart(chars, index)) {
      index = maskRegexLiteral(chars, text, index);
    } else if (char === '"' || char === "'") {
      index = maskQuotedText(chars, text, index, char);
    } else if (char === '`') {
      index = maskTemplateLiteral(chars, text, index);
    } else if (char === '{') {
      depth += 1;
      index += 1;
    } else if (char === '}') {
      depth -= 1;
      index += 1;
      if (depth === 0) return index;
    } else {
      index += 1;
    }
  }
  return index;
}

function maskTemplateLiteral(chars, text, start) {
  let index = start + 1;
  let literalStart = index;
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '\\') {
      index += 2;
    } else if (char === '`') {
      preserveNewlinesAsSpaces(chars, literalStart, index);
      return index + 1;
    } else if (char === '$' && next === '{') {
      preserveNewlinesAsSpaces(chars, literalStart, index);
      index = maskTemplateExpression(chars, text, index + 2);
      literalStart = index;
    } else {
      index += 1;
    }
  }
  preserveNewlinesAsSpaces(chars, literalStart, text.length);
  return index;
}

function maskLineComment(chars, text, start) {
  let index = start + 2;
  while (index < text.length && text[index] !== '\n' && text[index] !== '\r') index += 1;
  preserveNewlinesAsSpaces(chars, start, index);
  return index;
}

function maskBlockComment(chars, text, start) {
  let index = start + 2;
  while (index < text.length - 1) {
    if (text[index] === '*' && text[index + 1] === '/') {
      index += 2;
      break;
    }
    index += 1;
  }
  preserveNewlinesAsSpaces(chars, start, Math.min(index, text.length));
  return index;
}

function isIdentifierPart(char) {
  return /[A-Za-z0-9_$]/.test(char);
}

const REGEX_ALLOWED_AFTER_KEYWORDS = new Set([
  'await',
  'case',
  'delete',
  'do',
  'else',
  'in',
  'instanceof',
  'new',
  'of',
  'return',
  'throw',
  'typeof',
  'void',
  'yield',
]);

function previousSignificantIndex(chars, start) {
  for (let index = start - 1; index >= 0; index -= 1) {
    if (!/\s/.test(chars[index])) return index;
  }
  return -1;
}

function hasLineTerminatorBetween(text, start, end) {
  for (let index = start; index < end; index += 1) {
    if (text[index] === '\n' || text[index] === '\r') return true;
  }
  return false;
}

function delimiterDepthBefore(text, end) {
  let parenDepth = 0;
  let bracketDepth = 0;
  for (let index = 0; index < end; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
  }
  return { parenDepth, bracketDepth };
}

function canEndStatementAt(text, index) {
  const char = text[index];
  if (isIdentifierPart(char) || ')]}"\'`'.includes(char)) return true;
  return (char === '+' || char === '-') && text[index - 1] === char;
}

function isJsxClosingTagNamePart(char) {
  return typeof char === 'string' && /[A-Za-z0-9_$.:-]/.test(char);
}

function isAdjacentJsxClosingTagSlash(chars, start) {
  if (chars[start - 1] !== '<') return false;
  if (chars[start + 1] === '>') return true;
  if (!/[A-Za-z]/.test(chars[start + 1] || '')) return false;

  let index = start + 2;
  while (isJsxClosingTagNamePart(chars[index])) index += 1;
  while (/\s/.test(chars[index] || '')) index += 1;
  return chars[index] === '>';
}

function isRegexLiteralStart(chars, start) {
  if (isAdjacentJsxClosingTagSlash(chars, start)) return false;

  const previousIndex = previousSignificantIndex(chars, start);
  if (previousIndex === -1) return true;

  const previous = chars[previousIndex];
  if ('([{=,:;!~?&|+-*%^<>/'.includes(previous)) return true;
  if (!isIdentifierPart(previous)) return false;

  let wordStart = previousIndex;
  while (wordStart >= 0 && isIdentifierPart(chars[wordStart])) wordStart -= 1;
  const word = chars.slice(wordStart + 1, previousIndex + 1).join('');
  return REGEX_ALLOWED_AFTER_KEYWORDS.has(word);
}

function maskRegexLiteral(chars, text, start) {
  let index = start + 1;
  let end = -1;
  let inCharacterClass = false;
  while (index < text.length) {
    const char = text[index];
    if (char === '\n' || char === '\r') break;
    if (char === '\\') {
      index += 2;
      continue;
    }
    if (char === '[') {
      inCharacterClass = true;
      index += 1;
      continue;
    }
    if (char === ']' && inCharacterClass) {
      inCharacterClass = false;
      index += 1;
      continue;
    }
    if (char === '/' && !inCharacterClass) {
      end = index;
      index += 1;
      while (index < text.length && isIdentifierPart(text[index])) index += 1;
      break;
    }
    index += 1;
  }

  if (end === -1) return start + 1;
  preserveNewlinesAsSpaces(chars, start + 1, end);
  preserveNewlinesAsSpaces(chars, end + 1, index);
  return index;
}

function maskIgnorableSyntax(text) {
  const chars = text.split('');
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '/' && next === '/') {
      index = maskLineComment(chars, text, index);
    } else if (char === '/' && next === '*') {
      index = maskBlockComment(chars, text, index);
    } else if (char === '/' && isRegexLiteralStart(chars, index)) {
      index = maskRegexLiteral(chars, text, index);
    } else if (char === '"' || char === "'") {
      index = maskQuotedText(chars, text, index, char);
    } else if (char === '`') {
      index = maskTemplateLiteral(chars, text, index);
    } else {
      index += 1;
    }
  }
  return chars.join('');
}

function isNonReferenceIdentifierLocation(masked, startIndex, endIndex) {
  const previousIndex = previousSignificantIndex(masked, startIndex);
  if (previousIndex !== -1 && masked[previousIndex] === '#') return true;
  if (previousIndex !== -1 && masked[previousIndex] === '.' && !isSpreadTokenBefore(masked, previousIndex)) {
    return true;
  }

  const nextIndex = findNextNonWhitespace(masked, endIndex);
  return masked[nextIndex] === ':' && ['{', ','].includes(masked[previousIndex]);
}

function isSpreadTokenBefore(text, dotIndex) {
  if (text[dotIndex] !== '.') return false;
  const secondDotIndex = previousSignificantIndex(text, dotIndex);
  if (text[secondDotIndex] !== '.') return false;
  const firstDotIndex = previousSignificantIndex(text, secondDotIndex);
  return text[firstDotIndex] === '.';
}

function identifierReferenceMatches(source, identifier) {
  const name = normalizeJsIdentifier(identifier);
  if (!name) return { text: utils_normalizeString(source), matches: [] };
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?<![A-Za-z0-9_$])${escaped}(?![A-Za-z0-9_$])`, 'g');
  const text = utils_normalizeString(source);
  const masked = maskIgnorableSyntax(text)
    .replace(/<\/\s*[A-Za-z_$][A-Za-z0-9_$]*/g, (closingTag) => ' '.repeat(closingTag.length));
  const matches = Array.from(masked.matchAll(pattern))
    .filter((match) => !isNonReferenceIdentifierLocation(masked, match.index, match.index + match[0].length));
  return { text, matches };
}

function countIdentifierReferences(source, identifier) {
  return identifierReferenceMatches(source, identifier).matches.length;
}

function identifierReferenceLocations(source, identifier) {
  const { text, matches } = identifierReferenceMatches(source, identifier);
  const lineStarts = lineStartIndexes(text);
  return matches.map((match) => ({
    index: match.index,
    endIndex: match.index + match[0].length,
    line: lineNumberAt(match.index, lineStarts),
  }));
}

function lineStartIndexes(text) {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') starts.push(index + 1);
  }
  return starts;
}

function lineNumberAt(index, starts) {
  let low = 0;
  let high = starts.length - 1;
  let found = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (starts[mid] <= index) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found + 1;
}

function findNextNonWhitespace(text, start) {
  let index = start;
  while (index < text.length && /\s/.test(text[index])) index += 1;
  return index;
}

function findMatchingDelimiter(text, start, openChar, closeChar) {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === openChar) {
      depth += 1;
    } else if (text[index] === closeChar) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function findTopLevelArrow(text, start) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < text.length - 1; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === ';' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) return -1;

    if (
      char === '='
      && text[index + 1] === '>'
      && parenDepth === 0
      && bracketDepth === 0
      && braceDepth === 0
    ) {
      return index;
    }
  }
  return -1;
}

function findExpressionEnd(text, start) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let lastNonWhitespace = start;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (!/\s/.test(char)) lastNonWhitespace = index;
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === ';' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) return index;
  }
  return lastNonWhitespace;
}

function findQuotedLiteralEnd(text, start) {
  const quote = text[start];
  for (let index = start + 1; index < text.length; index += 1) {
    if (text[index] === quote) return index;
  }
  return -1;
}

function findRegexLiteralEnd(text, start) {
  for (let index = start + 1; index < text.length; index += 1) {
    if (text[index] === '/') return index;
  }
  return -1;
}

function declarationSpan({ name, kind, startIndex, endIndex, nameStartIndex, lineStarts, declarationType }) {
  const startLine = lineNumberAt(startIndex, lineStarts);
  const endLine = lineNumberAt(endIndex, lineStarts);
  const span = {
    name,
    kind,
    startLine,
    endLine,
    lineCount: endLine - startLine + 1,
  };
  Object.defineProperties(span, {
    startIndex: { value: startIndex },
    endIndex: { value: endIndex },
    nameStartIndex: { value: nameStartIndex },
    nameEndIndex: { value: Number.isInteger(nameStartIndex) ? nameStartIndex + name.length : null },
    declarationType: { value: declarationType },
  });
  return span;
}

function compareDeclarationSpan(a, b) {
  return a.name.localeCompare(b.name)
    || a.startLine - b.startLine
    || a.endLine - b.endLine
    || a.kind.localeCompare(b.kind);
}

function functionDeclarationTypeAt(masked, startIndex) {
  const previousIndex = previousSignificantIndex(masked, startIndex);
  if (previousIndex === -1 || ';}'.includes(masked[previousIndex])) return 'function-declaration';
  if (masked[previousIndex] === '{') {
    return masked[previousIndex - 1] === '$' ? 'function-expression-name' : 'function-declaration';
  }
  if (
    hasLineTerminatorBetween(masked, previousIndex + 1, startIndex)
    && canEndStatementAt(masked, previousIndex)
  ) {
    const { parenDepth, bracketDepth } = delimiterDepthBefore(masked, startIndex);
    if (parenDepth === 0 && bracketDepth === 0) return 'function-declaration';
  }
  return 'function-expression-name';
}

function extractDeclarationSpans(source) {
  const text = normalizeString(source);
  if (!text) return [];
  const masked = maskIgnorableSyntax(text);
  const lineStarts = lineStartIndexes(text);
  const spans = [];

  const functionPattern = /\b(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
  let match;
  while ((match = functionPattern.exec(masked))) {
    const parametersStart = match.index + match[0].lastIndexOf('(');
    const parametersEnd = findMatchingDelimiter(masked, parametersStart, '(', ')');
    if (parametersEnd === -1) continue;
    const bodyStart = findNextNonWhitespace(masked, parametersEnd + 1);
    if (masked[bodyStart] !== '{') continue;
    const bodyEnd = findMatchingDelimiter(masked, bodyStart, '{', '}');
    if (bodyEnd === -1) continue;
    spans.push(declarationSpan({
      name: match[1],
      kind: 'function',
      startIndex: match.index,
      endIndex: bodyEnd,
      nameStartIndex: match.index + match[0].lastIndexOf(match[1]),
      declarationType: functionDeclarationTypeAt(masked, match.index),
      lineStarts,
    }));
  }

  const arrowPattern = /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
  while ((match = arrowPattern.exec(masked))) {
    const arrowIndex = findTopLevelArrow(masked, arrowPattern.lastIndex);
    if (arrowIndex === -1) continue;
    const bodyStart = findNextNonWhitespace(masked, arrowIndex + 2);
    if (bodyStart >= masked.length) continue;
    let bodyEnd = -1;
    if (masked[bodyStart] === '{') {
      bodyEnd = findMatchingDelimiter(masked, bodyStart, '{', '}');
    } else if (masked[bodyStart] === '(') {
      bodyEnd = findMatchingDelimiter(masked, bodyStart, '(', ')');
    } else if (masked[bodyStart] === '[') {
      bodyEnd = findMatchingDelimiter(masked, bodyStart, '[', ']');
    } else if (masked[bodyStart] === '"' || masked[bodyStart] === "'" || masked[bodyStart] === '`') {
      bodyEnd = findQuotedLiteralEnd(masked, bodyStart);
    } else if (masked[bodyStart] === '/') {
      bodyEnd = findRegexLiteralEnd(masked, bodyStart);
    } else {
      bodyEnd = findExpressionEnd(masked, bodyStart);
    }
    if (bodyEnd === -1) continue;
    spans.push(declarationSpan({
      name: match[1],
      kind: 'arrow',
      startIndex: match.index,
      endIndex: bodyEnd,
      nameStartIndex: match.index + match[0].lastIndexOf(match[1]),
      declarationType: 'arrow-variable',
      lineStarts,
    }));
  }

  return spans.sort(compareDeclarationSpan);
}

;// CONCATENATED MODULE: ./src/lib/options.js


const DEFAULT_MODULE_LIMIT = 500;
const MAX_MODULE_LIMIT = 100000;
const DEFAULT_SOURCE_MODE = 'none';
const SOURCE_MODES = new Set(['none', 'declarations', 'full']);
const DEFAULT_FRAMEWORK = 'auto';
const FRAMEWORKS = new Set(['auto', 'vanilla', 'react']);

function normalizeSourceMode(value = DEFAULT_SOURCE_MODE) {
  const mode = normalizeString(value || DEFAULT_SOURCE_MODE).trim().toLowerCase();
  if (!SOURCE_MODES.has(mode)) {
    throw new Error('--source-mode must be one of none, declarations, or full.');
  }
  return mode;
}

function normalizeModuleLimit(value = DEFAULT_MODULE_LIMIT) {
  const raw = value == null || value === '' ? String(DEFAULT_MODULE_LIMIT) : utils_normalizeString(value).trim();
  if (!/^\d+$/.test(raw)) {
    throw new Error(`--module-limit must be an integer from 1 to ${MAX_MODULE_LIMIT}.`);
  }
  const limit = Number(raw);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_MODULE_LIMIT) {
    throw new Error(`--module-limit must be an integer from 1 to ${MAX_MODULE_LIMIT}.`);
  }
  return limit;
}

function normalizeFramework(value = DEFAULT_FRAMEWORK) {
  const framework = utils_normalizeString(value || DEFAULT_FRAMEWORK).trim().toLowerCase();
  if (!FRAMEWORKS.has(framework)) {
    throw new Error('--framework must be one of auto, vanilla, or react.');
  }
  return framework;
}

function sourcePrivacyMetadata(sourceMode, {
  declarationCount = 0,
  moduleSourceCount = 0,
} = {}) {
  const mode = normalizeSourceMode(sourceMode);
  const declarationSourceAvailable = mode === 'declarations' || mode === 'full';
  const moduleSourceAvailable = mode === 'full';
  return {
    sourceMode: mode,
    declarationSourceAvailable,
    moduleSourceAvailable,
    sourceArtifacts: {
      sourceCodeJson: declarationSourceAvailable,
      sourceModulesJson: moduleSourceAvailable,
      functionMapJson: true,
    },
    capabilities: {
      sourceDialogs: declarationSourceAvailable,
      moduleSourceApi: moduleSourceAvailable,
      occurrenceSearch: moduleSourceAvailable,
      structuralFunctionMap: true,
    },
    counts: {
      declarationSourceCount: declarationSourceAvailable ? declarationCount : 0,
      moduleSourceCount: moduleSourceAvailable ? moduleSourceCount : 0,
    },
  };
}

// EXTERNAL MODULE: ./node_modules/@babel/parser/lib/index.js
var lib = __nccwpck_require__(429);
;// CONCATENATED MODULE: ./src/lib/javascript-ast-analysis.js






const BROWSER_SCRIPT_EXTENSIONS = new Set(['.js', '.jsx', '.mjs']);
const BROWSER_GLOBALS = new Map([
  ['window', 'browser:window'],
  ['document', 'browser:document'],
  ['navigator', 'browser:navigator'],
  ['location', 'browser:location'],
  ['history', 'browser:history'],
  ['localStorage', 'browser:localStorage'],
  ['sessionStorage', 'browser:sessionStorage'],
  ['indexedDB', 'browser:indexedDB'],
  ['caches', 'browser:caches'],
  ['fetch', 'browser:fetch'],
  ['URL', 'browser:URL'],
  ['URLSearchParams', 'browser:URLSearchParams'],
  ['WebSocket', 'browser:WebSocket'],
  ['Worker', 'browser:Worker'],
  ['SharedWorker', 'browser:SharedWorker'],
  ['BroadcastChannel', 'browser:BroadcastChannel'],
  ['crypto', 'browser:crypto'],
  ['performance', 'browser:performance'],
  ['requestAnimationFrame', 'browser:animation-frame'],
  ['cancelAnimationFrame', 'browser:animation-frame'],
  ['addEventListener', 'browser:event-target'],
  ['removeEventListener', 'browser:event-target'],
  ['matchMedia', 'browser:media-query'],
]);
const IGNORED_TRAVERSE_KEYS = new Set([
  'comments',
  'end',
  'errors',
  'extra',
  'innerComments',
  'leadingComments',
  'loc',
  'start',
  'trailingComments',
  'tokens',
]);

function isBrowserScriptPath(modulePath) {
  return BROWSER_SCRIPT_EXTENSIONS.has(external_node_path_namespaceObject.posix.extname(toPosixPath(modulePath)).toLowerCase());
}

function parseSourceFile(filePath, sourceText) {
  try {
    return (0,lib/* parse */.qg)(sourceText, {
      sourceFilename: filePath,
      sourceType: 'module',
      errorRecovery: true,
      plugins: ['jsx', 'importAttributes'],
    });
  } catch (error) {
    throw new Error(`Unable to parse browser JavaScript/JSX module ${toPosixPath(filePath)}: ${error.message}`);
  }
}

function childNodes(node) {
  const children = [];
  if (!node || typeof node !== 'object') return children;
  for (const [key, value] of Object.entries(node)) {
    if (IGNORED_TRAVERSE_KEYS.has(key)) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item.type === 'string') children.push(item);
      }
    } else if (value && typeof value.type === 'string') {
      children.push(value);
    }
  }
  return children;
}

function traverseAst(root, enter) {
  const visit = (node, parent = null, grandparent = null) => {
    if (!node || typeof node.type !== 'string') return;
    enter(node, parent, grandparent);
    for (const child of childNodes(node)) visit(child, node, parent);
  };
  visit(root);
}

function lineNumberAtSourcePosition(sourceFile, position) {
  const loc = sourceFile.loc && Number.isInteger(position)
    ? sourceFile.loc
    : null;
  return loc?.start?.line || 1;
}

function columnNumberAtSourcePosition(sourceFile, position) {
  const loc = sourceFile.loc && Number.isInteger(position)
    ? sourceFile.loc
    : null;
  return Number.isInteger(loc?.start?.column) ? loc.start.column + 1 : 1;
}

function nodeStart(node) {
  return Number.isInteger(node?.start) ? node.start : 0;
}

function nodeInclusiveEnd(node) {
  return Number.isInteger(node?.end) ? Math.max(nodeStart(node), node.end - 1) : nodeStart(node);
}

function javascript_ast_analysis_declarationSpan({
  name,
  kind,
  node,
  nameNode,
  startNode = node,
  endNode = node,
  declarationType,
}) {
  const startIndex = nodeStart(startNode);
  const endIndex = nodeInclusiveEnd(endNode);
  const startLine = startNode?.loc?.start?.line || 1;
  const endLine = endNode?.loc?.end?.line || startLine;
  const nameStartIndex = Number.isInteger(nameNode?.start) ? nameNode.start : null;
  const span = {
    name,
    kind,
    startLine,
    endLine,
    lineCount: endLine - startLine + 1,
  };
  Object.defineProperties(span, {
    startIndex: { value: startIndex },
    endIndex: { value: endIndex },
    nameStartIndex: { value: nameStartIndex },
    nameEndIndex: { value: Number.isInteger(nameStartIndex) ? nameStartIndex + name.length : null },
    declarationType: { value: declarationType },
  });
  return span;
}

function identifierName(node) {
  return node?.type === 'Identifier' ? node.name : '';
}

function variableStatementForDeclaration(parent, grandparent) {
  return grandparent?.type === 'ExportNamedDeclaration' || grandparent?.type === 'ExportDefaultDeclaration'
    ? grandparent
    : parent;
}

function functionDeclarationType(node) {
  if (node?.type === 'FunctionDeclaration') return 'function-declaration';
  if (node?.type === 'FunctionExpression') return 'function-expression-name';
  return 'arrow-variable';
}

function collectDeclarationSpans(sourceFile) {
  const spans = [];
  traverseAst(sourceFile.program, (node, parent, grandparent) => {
    if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') && node.id && node.body) {
      const name = identifierName(node.id);
      if (name) {
        spans.push(javascript_ast_analysis_declarationSpan({
          name,
          kind: 'function',
          node,
          nameNode: node.id,
          declarationType: functionDeclarationType(node),
        }));
      }
    }

    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.init) {
      const initializer = node.init;
      if (initializer.type === 'ArrowFunctionExpression' || initializer.type === 'FunctionExpression') {
        const statement = variableStatementForDeclaration(parent, grandparent) || node;
        spans.push(javascript_ast_analysis_declarationSpan({
          name: node.id.name,
          kind: initializer.type === 'ArrowFunctionExpression' ? 'arrow' : 'function',
          node,
          nameNode: node.id,
          startNode: statement,
          endNode: initializer,
          declarationType: initializer.type === 'ArrowFunctionExpression'
            ? 'arrow-variable'
            : 'function-expression-name',
        }));
      }
    }
  });
  return spans.sort((a, b) => compareLocale(a.name, b.name)
    || a.startLine - b.startLine
    || a.endLine - b.endLine
    || compareLocale(a.kind, b.kind));
}

function stringLiteralText(node) {
  if (!node) return '';
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'DirectiveLiteral') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value?.cooked ?? node.quasis[0]?.value?.raw ?? '';
  }
  return '';
}

function javascript_ast_analysis_collectStringConstants(sourceFile) {
  const constants = new Map();
  traverseAst(sourceFile.program, (node) => {
    if (
      node.type === 'VariableDeclarator'
      && node.id?.type === 'Identifier'
      && node.init
    ) {
      const value = stringLiteralText(node.init);
      if (value) constants.set(node.id.name, value);
    }
  });
  return constants;
}

function staticStringExpressionText(node, constants) {
  const literal = stringLiteralText(node);
  if (literal) return literal;
  if (node?.type === 'Identifier') return constants.get(node.name) || '';
  return '';
}

function bindingKind(imported) {
  return imported === 'default' ? 'default' : 'named';
}

function importDeclarationRef(node) {
  const specifier = stringLiteralText(node.source);
  if (!specifier) return null;
  const bindings = [];
  for (const imported of Array.isArray(node.specifiers) ? node.specifiers : []) {
    if (imported.type === 'ImportDefaultSpecifier') {
      bindings.push({
        imported: 'default',
        local: imported.local.name,
        kind: 'default',
        inferred: false,
      });
    } else if (imported.type === 'ImportNamespaceSpecifier') {
      bindings.push({
        imported: '*',
        local: imported.local.name,
        kind: 'namespace',
        inferred: false,
      });
    } else if (imported.type === 'ImportSpecifier') {
      const importedName = identifierName(imported.imported) || stringLiteralText(imported.imported);
      bindings.push({
        imported: importedName,
        local: imported.local.name,
        kind: bindingKind(importedName),
        inferred: false,
      });
    }
  }
  return {
    specifier,
    kind: bindings.length > 0 ? 'static' : 'side-effect',
    bindings,
  };
}

function exportDeclarationRef(node) {
  const specifier = stringLiteralText(node.source);
  if (!specifier) return null;
  const bindings = [];
  for (const exported of Array.isArray(node.specifiers) ? node.specifiers : []) {
    if (exported.type !== 'ExportSpecifier') continue;
    const imported = identifierName(exported.local) || stringLiteralText(exported.local);
    const local = identifierName(exported.exported) || stringLiteralText(exported.exported);
    if (imported && local) {
      bindings.push({
        imported,
        local,
        kind: 'named',
        inferred: false,
      });
    }
  }
  return { specifier, kind: 'export', bindings };
}

function normalizeBinding(binding = {}) {
  const kind = utils_normalizeString(binding.kind || 'named').trim() || 'named';
  const imported = kind === 'namespace'
    ? '*'
    : kind === 'default'
      ? 'default'
      : utils_normalizeString(binding.imported).trim();
  const local = utils_normalizeString(binding.local).trim();
  if (!imported || !local) return null;
  return {
    imported,
    local,
    kind,
    inferred: Boolean(binding.inferred),
  };
}

function normalizeRef(ref = {}) {
  const specifier = utils_normalizeString(ref?.specifier).trim();
  if (!specifier) return null;
  const bindings = (Array.isArray(ref.bindings) ? ref.bindings : [])
    .map(normalizeBinding)
    .filter(Boolean)
    .sort((a, b) => compareLocale(a.kind, b.kind)
      || compareLocale(a.imported, b.imported)
      || compareLocale(a.local, b.local));
  return {
    specifier,
    bindings,
    kind: utils_normalizeString(ref.kind || 'static').trim() || 'static',
  };
}

function calleeName(node) {
  if (!node) return '';
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'ThisExpression') return 'this';
  if (node.type === 'Super') return 'super';
  if (node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression') {
    if (node.computed) return '';
    const property = identifierName(node.property);
    const object = calleeName(node.object);
    return object && property ? `${object}.${property}` : property;
  }
  return '';
}

function importedSpecifierFromImportExpression(node, constants) {
  if (!node) return '';
  if (node.type === 'AwaitExpression') return importedSpecifierFromImportExpression(node.argument, constants);
  if (node.type === 'ImportExpression') return staticStringExpressionText(node.source, constants);
  if (node.type !== 'CallExpression' && node.type !== 'OptionalCallExpression') return '';
  const name = calleeName(node.callee);
  if (node.callee?.type !== 'Import' && name !== 'window.import') return '';
  return node.arguments[0] ? staticStringExpressionText(node.arguments[0], constants) : '';
}

function firstImportedSpecifierInExpression(node, constants) {
  const direct = importedSpecifierFromImportExpression(node, constants);
  if (direct) return direct;
  let found = '';
  const visit = (candidate) => {
    if (!candidate || found) return;
    const specifier = importedSpecifierFromImportExpression(candidate, constants);
    if (specifier) {
      found = specifier;
      return;
    }
    for (const child of childNodes(candidate)) visit(child);
  };
  visit(node);
  return found;
}

function importedSpecifierFromLazyInitializer(node, constants) {
  if (node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression') {
    if (node.body?.type === 'BlockStatement') {
      for (const statement of node.body.body || []) {
        if (statement.type === 'ReturnStatement') {
          const specifier = firstImportedSpecifierInExpression(statement.argument, constants);
          if (specifier) return specifier;
        }
      }
      return '';
    }
    return firstImportedSpecifierInExpression(node.body, constants);
  }
  return '';
}

function workerSpecifierFromExpression(node, constants) {
  if (!node || !['CallExpression', 'NewExpression'].includes(node.type)) return '';
  const name = calleeName(node.callee);
  if (name !== 'Worker' && name !== 'SharedWorker') return '';
  const first = node.arguments?.[0];
  if (!first) return '';
  const literal = staticStringExpressionText(first, constants);
  if (literal) return literal;
  if (
    first.type === 'NewExpression'
    && calleeName(first.callee) === 'URL'
    && first.arguments?.[0]
  ) {
    return staticStringExpressionText(first.arguments[0], constants);
  }
  return '';
}

function bindingNameFromNameNode(node) {
  return node?.type === 'Identifier' ? node.name : '';
}

function dynamicImportBindingsFromBindingName(node) {
  if (!node) return [];
  if (node.type === 'Identifier') {
    return [{
      imported: '*',
      local: node.name,
      kind: 'namespace',
      inferred: false,
    }];
  }
  if (node.type === 'ObjectPattern') {
    return node.properties
      .map((property) => {
        if (property.type !== 'ObjectProperty') return null;
        const imported = identifierName(property.key) || stringLiteralText(property.key);
        const local = bindingNameFromNameNode(property.value);
        if (!imported || !local) return null;
        return {
          imported,
          local,
          kind: imported === 'default' ? 'default' : 'named',
          inferred: false,
        };
      })
      .filter(Boolean);
  }
  return [];
}

function lazyComponentBindingFromBindingName(node) {
  if (!node || node.type !== 'Identifier') return [];
  return [{
    imported: 'default',
    local: node.name,
    kind: 'default',
    inferred: false,
  }];
}

function expressionFromMaybeAwait(node) {
  if (node?.type === 'AwaitExpression') return node.argument;
  return node;
}

function commonJsRefFromAssignment(node) {
  if (node?.type !== 'AssignmentExpression' || node.operator !== '=') return null;
  const leftName = calleeName(node.left);
  if (leftName !== 'module.exports' && !leftName.startsWith('exports.')) return null;
  return {
    kind: 'commonjs-export',
    specifier: '',
    line: node.loc?.start?.line || 1,
    column: Number.isInteger(node.loc?.start?.column) ? node.loc.start.column + 1 : 1,
  };
}

function collectImportRefs(sourceFile) {
  const refs = [];
  const commonJsRefs = [];
  const constants = javascript_ast_analysis_collectStringConstants(sourceFile);

  traverseAst(sourceFile.program, (node) => {
    if (node.type === 'VariableDeclarator' && node.init) {
      const expression = expressionFromMaybeAwait(node.init);
      const specifier = importedSpecifierFromImportExpression(expression, constants);
      const bindings = specifier ? dynamicImportBindingsFromBindingName(node.id) : [];
      if (specifier && bindings.length > 0) refs.push({ specifier, kind: 'dynamic', bindings });

      const lazySpecifier = ['React.lazy', 'lazy'].includes(calleeName(expression?.callee))
        ? importedSpecifierFromLazyInitializer(expression.arguments?.[0], constants)
        : '';
      const lazyBindings = lazySpecifier ? lazyComponentBindingFromBindingName(node.id) : [];
      if (lazySpecifier && lazyBindings.length > 0) {
        refs.push({ specifier: lazySpecifier, kind: 'lazy', bindings: lazyBindings });
      }
    }

    const declarationRef = node.type === 'ImportDeclaration'
      ? importDeclarationRef(node)
      : (node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration')
        ? exportDeclarationRef(node)
        : null;
    const normalizedDeclarationRef = normalizeRef(declarationRef);
    if (normalizedDeclarationRef) refs.push(normalizedDeclarationRef);

    const dynamicSpecifier = importedSpecifierFromImportExpression(node, constants);
    if (dynamicSpecifier) refs.push({ specifier: dynamicSpecifier, kind: 'dynamic', bindings: [] });

    if (node.type === 'CallExpression' || node.type === 'NewExpression') {
      const callName = calleeName(node.callee);
      const lazySpecifier = ['React.lazy', 'lazy'].includes(callName)
        ? importedSpecifierFromLazyInitializer(node.arguments?.[0], constants)
        : '';
      if (lazySpecifier) refs.push({ specifier: lazySpecifier, kind: 'lazy', bindings: [] });

      const workerSpecifier = workerSpecifierFromExpression(node, constants);
      if (workerSpecifier) refs.push({ specifier: workerSpecifier, kind: 'worker', bindings: [] });

      if (callName === 'require') {
        commonJsRefs.push({
          kind: 'require-call',
          specifier: stringLiteralText(node.arguments?.[0]) || '',
          line: node.loc?.start?.line || 1,
          column: Number.isInteger(node.loc?.start?.column) ? node.loc.start.column + 1 : 1,
        });
      }
    }

    const commonJsRef = commonJsRefFromAssignment(node);
    if (commonJsRef) commonJsRefs.push(commonJsRef);
  });

  const seen = new Set();
  const normalizedRefs = refs
    .map(normalizeRef)
    .filter(Boolean);
  const refsWithBindings = new Set(normalizedRefs
    .filter((ref) => ref.bindings.length > 0)
    .map((ref) => `${ref.kind}\u0000${ref.specifier}`));
  const imports = normalizedRefs
    .filter((ref) => !(ref.bindings.length === 0 && refsWithBindings.has(`${ref.kind}\u0000${ref.specifier}`)))
    .filter((ref) => {
      const key = [ref.kind, ref.specifier, JSON.stringify(ref.bindings)].join('\u0000');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => compareLocale(a.kind, b.kind)
      || compareLocale(a.specifier, b.specifier)
      || compareLocale(JSON.stringify(a.bindings), JSON.stringify(b.bindings)));
  return { imports, commonJsRefs };
}

function jsxTagName(node) {
  if (!node) return '';
  if (node.type === 'JSXIdentifier') return node.name;
  if (node.type === 'JSXMemberExpression') return `${jsxTagName(node.object)}.${jsxTagName(node.property)}`;
  if (node.type === 'JSXNamespacedName') return `${jsxTagName(node.namespace)}:${jsxTagName(node.name)}`;
  return '';
}

function isComponentName(name) {
  return /^[A-Z]/.test(utils_normalizeString(name).split('.')[0] || '');
}

function jsxAttribute(attributes, name) {
  return (attributes || []).find((candidate) => (
    candidate.type === 'JSXAttribute' && candidate.name?.name === name
  )) || null;
}

function jsxAttributeValue(attributes, name) {
  const property = jsxAttribute(attributes, name);
  if (!property || !property.value) return '';
  if (property.value.type === 'StringLiteral') return property.value.value;
  if (
    property.value.type === 'JSXExpressionContainer'
    && property.value.expression
  ) {
    return stringLiteralText(property.value.expression);
  }
  return '';
}

function jsxAttributeExpression(attributes, name) {
  const property = jsxAttribute(attributes, name);
  if (!property || property.value?.type !== 'JSXExpressionContainer') return null;
  return property.value.expression || null;
}

function firstComponentNameInExpression(node) {
  if (!node) return '';
  if (node.type === 'Identifier' && isComponentName(node.name)) return node.name;
  if (node.type === 'JSXElement') return jsxTagName(node.openingElement?.name);
  if (node.type === 'JSXFragment') return 'Fragment';
  let found = '';
  for (const child of childNodes(node)) {
    if (!found) found = firstComponentNameInExpression(child);
  }
  return found;
}

function objectPropertyName(node) {
  return identifierName(node) || stringLiteralText(node);
}

function objectLiteralPropertyString(node, propertyName) {
  if (node?.type !== 'ObjectExpression') return '';
  const property = (node.properties || []).find((candidate) => (
    candidate.type === 'ObjectProperty'
    && objectPropertyName(candidate.key) === propertyName
  ));
  return property ? stringLiteralText(property.value) : '';
}

function objectLiteralPropertyComponent(node) {
  if (node?.type !== 'ObjectExpression') return '';
  const keys = new Set(['element', 'Component', 'component']);
  for (const property of node.properties || []) {
    if (property.type !== 'ObjectProperty' || !keys.has(objectPropertyName(property.key))) continue;
    return firstComponentNameInExpression(property.value);
  }
  return '';
}

function routeObjectsFromExpression(node) {
  if (!node || node.type !== 'ArrayExpression') return [];
  const routes = [];
  const visitRouteObject = (objectNode, parentPath = '') => {
    if (objectNode?.type !== 'ObjectExpression') return;
    const routePath = objectLiteralPropertyString(objectNode, 'path');
    const component = objectLiteralPropertyComponent(objectNode);
    const fullPath = routePath
      ? routePath.startsWith('/') || !parentPath
        ? routePath
        : `${parentPath.replace(/\/+$/g, '')}/${routePath.replace(/^\/+/g, '')}`
      : parentPath;
    if (fullPath || component) {
      routes.push({
        path: fullPath || '',
        component,
        adapter: 'react-router',
        sourceKind: 'createBrowserRouter',
        line: objectNode.loc?.start?.line || 1,
      });
    }
    const childrenProperty = (objectNode.properties || []).find((candidate) => (
      candidate.type === 'ObjectProperty'
      && objectPropertyName(candidate.key) === 'children'
      && candidate.value?.type === 'ArrayExpression'
    ));
    if (childrenProperty) {
      for (const child of childrenProperty.value.elements || []) visitRouteObject(child, fullPath);
    }
  };
  for (const element of node.elements || []) visitRouteObject(element);
  return routes;
}

function nearestDeclarationName(declarationSpans, index) {
  const candidates = declarationSpans
    .filter((span) => Number.isInteger(span.startIndex)
      && Number.isInteger(span.endIndex)
      && index >= span.startIndex
      && index <= span.endIndex)
    .sort((a, b) => (a.endIndex - a.startIndex) - (b.endIndex - b.startIndex));
  return candidates[0]?.name || '';
}

function collectFrontEndFacts(sourceFile, declarationSpans) {
  const components = new Map();
  const componentRefs = [];
  const routes = [];
  const browserApis = new Map();

  for (const span of declarationSpans) {
    if (/^[A-Z]/.test(span.name) || /^use[A-Z0-9]/.test(span.name)) {
      components.set(span.name, {
        name: span.name,
        kind: /^[A-Z]/.test(span.name) ? 'component' : 'hook',
        modulePath: '',
        startLine: span.startLine,
        endLine: span.endLine,
      });
    }
  }

  const addBrowserApi = (name, node) => {
    const api = BROWSER_GLOBALS.get(name);
    if (!api) return;
    const line = lineNumberAtSourcePosition(node, nodeStart(node));
    const key = `${api}\u0000${line}`;
    if (!browserApis.has(key)) {
      browserApis.set(key, {
        api,
        name,
        line,
        column: columnNumberAtSourcePosition(node, nodeStart(node)),
      });
    }
  };

  traverseAst(sourceFile.program, (node) => {
    if (node.type === 'JSXOpeningElement') {
      const tag = jsxTagName(node.name);
      const line = node.loc?.start?.line || 1;
      const owner = nearestDeclarationName(declarationSpans, nodeStart(node));
      if (isComponentName(tag)) {
        componentRefs.push({
          owner,
          component: tag,
          line,
          sourceKind: 'jsx-element',
        });
      }
      if (tag === 'Route' || tag.endsWith('.Route')) {
        const routePath = jsxAttributeValue(node.attributes, 'path') || jsxAttributeValue(node.attributes, 'index');
        const elementExpression = jsxAttributeExpression(node.attributes, 'element')
          || jsxAttributeExpression(node.attributes, 'Component');
        routes.push({
          path: routePath === 'true' ? '' : routePath,
          component: firstComponentNameInExpression(elementExpression),
          adapter: 'react-router',
          sourceKind: 'jsx-route',
          line,
        });
      }
    }

    if (node.type === 'CallExpression' && calleeName(node.callee) === 'createBrowserRouter') {
      routes.push(...routeObjectsFromExpression(node.arguments?.[0]));
    }

    if (node.type === 'Identifier') addBrowserApi(node.name, node);
  });

  return {
    components: Array.from(components.values()).sort((a, b) => compareLocale(a.name, b.name)),
    componentRefs: componentRefs.sort((a, b) => compareLocale(a.owner, b.owner)
      || compareLocale(a.component, b.component)
      || a.line - b.line),
    routes: routes
      .filter((route) => route.path || route.component)
      .sort((a, b) => compareLocale(a.path, b.path)
        || compareLocale(a.component, b.component)
        || a.line - b.line),
    browserApis: Array.from(browserApis.values())
      .sort((a, b) => compareLocale(a.api, b.api) || a.line - b.line),
  };
}

function createJavaScriptAstAnalysisContext() {
  const sourceFiles = new Map();
  const analyzer = {
    name: 'javascript-ast',
    parser: '@babel/parser',
    language: 'browser-jsx',
  };

  const sourceFileFor = (filePath, sourceText) => {
    const resolved = external_node_path_namespaceObject.resolve(filePath);
    const cacheKey = `${resolved}\u0000${sourceText}`;
    if (!sourceFiles.has(cacheKey)) sourceFiles.set(cacheKey, parseSourceFile(resolved, sourceText));
    return sourceFiles.get(cacheKey);
  };

  return {
    analyzer,
    backend: analyzer,
    analyzeFile(filePath, sourceText) {
      if (!isBrowserScriptPath(filePath)) {
        throw new Error(`IronGlancer only analyzes browser JavaScript modules (.js, .jsx, .mjs): ${toPosixPath(filePath)}`);
      }
      const sourceFile = sourceFileFor(filePath, sourceText);
      const declarationSpans = collectDeclarationSpans(sourceFile);
      const { imports, commonJsRefs } = collectImportRefs(sourceFile);
      const facts = collectFrontEndFacts(sourceFile, declarationSpans);
      return {
        declarationSpans,
        importRefs: imports,
        commonJsRefs,
        typeOnlyRanges: [],
        ...facts,
      };
    },
  };
}

;// CONCATENATED MODULE: ./src/lib/analyze-project.js









const DEFAULT_ENTRY_CANDIDATES = [
  'index.html',
  'src/index.html',
  'src/main.jsx',
  'src/main.js',
  'src/index.jsx',
  'src/index.js',
  'src/app.jsx',
  'src/app.js',
];

const DEFAULT_ROUTE_ALIASES = [
  { from: '/', to: '' },
  { from: '/', to: 'public' },
];

const HTML_ENTRY_EXTENSIONS = new Set(['.html', '.htm']);
const ANALYZABLE_MODULE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs']);
const ASSET_EXTENSIONS = new Set([
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.json',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.wasm',
  '.worker.js',
  '.worker.mjs',
]);
const EXCLUDED_DISCOVERY_DIRS = new Set([
  '.git',
  '.hg',
  '.svn',
  'node_modules',
  'bower_components',
  'dist',
  'build',
  'coverage',
  'out',
  'site',
  'docs',
  '.worktrees',
  '.codex-worktrees',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.parcel-cache',
  '.vite',
]);
const lexicalBlockRangeCache = new WeakMap();
const loopScopeRangeCache = new WeakMap();
const stringConstantValueCache = new WeakMap();
const identifierReferenceLocationCache = new WeakMap();
const visibleLocalBindingLocationCache = new WeakMap();
const FUNCTION_DEPENDENCY_LIMITATIONS = [
  'Static function dependencies are based on identifier references inside saved declaration spans; IronGlancer does not execute code or prove runtime control flow.',
  'Usage syntax is labeled as call, optional-call, tagged-template, jsx-element, or reference from nearby source syntax; reference entries are not claimed to be definite runtime calls.',
  'Imported targets are limited to browser ESM imports, dynamic imports, React.lazy boundaries, and module worker entries with statically resolvable bindings.',
  'Same-module targets are limited to named function declarations and named arrow-function variable declarations discovered in the same file; dynamic property dispatch, aliasing through arbitrary values, and unresolved re-exports are outside this map.',
  'Placement review is deterministic static affinity evidence; it is a review aid, not a runtime ownership proof or definitive dead-code detector.',
];
const PLATFORM_IMPORT_SPECIFIERS = new Set([
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'diagnostics_channel',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
]);
const UNSUPPORTED_SOURCE_EXTENSIONS = new Set(['.cjs', '.cts', '.mts', '.ts', '.tsx']);
const BROWSER_PLATFORM_NAMESPACES = new Map([
  ['window', 'browser:window'],
  ['document', 'browser:document'],
  ['navigator', 'browser:navigator'],
  ['localStorage', 'browser:localStorage'],
  ['sessionStorage', 'browser:sessionStorage'],
  ['Intl', 'browser:Intl'],
  ['URL', 'browser:URL'],
  ['Math', 'browser:Math'],
  ['console', 'browser:console'],
]);
const BROWSER_PLATFORM_IDENTIFIERS = new Map([
  ['Date', 'browser:Date'],
  ['fetch', 'browser:fetch'],
  ['setTimeout', 'browser:timers'],
  ['clearTimeout', 'browser:timers'],
  ['setInterval', 'browser:timers'],
  ['clearInterval', 'browser:timers'],
  ['requestAnimationFrame', 'browser:animation-frame'],
]);

function normalizeImportAliasTarget(value) {
  return toPosixPath(utils_normalizeString(value).trim());
}

function parseAliasString(value) {
  const raw = utils_normalizeString(value).trim();
  const separatorIndex = raw.indexOf('=');
  if (separatorIndex === -1) {
    throw new Error(`Invalid alias "${raw}". Use specifier=path.`);
  }
  const from = raw.slice(0, separatorIndex).trim();
  const to = raw.slice(separatorIndex + 1).trim();
  if (!from || !to) throw new Error('Aliases must include both a specifier and target path.');
  return [from, normalizeImportAliasTarget(to)];
}

function normalizeImportAliases(values = []) {
  const aliases = new Map();
  const entries = Array.isArray(values) ? values : [values].filter(Boolean);
  for (const entry of entries) {
    if (typeof entry === 'string') {
      const [from, to] = parseAliasString(entry);
      aliases.set(from, to);
    } else if (Array.isArray(entry)) {
      aliases.set(utils_normalizeString(entry[0]).trim(), normalizeImportAliasTarget(entry[1]));
    } else if (entry && typeof entry === 'object') {
      aliases.set(utils_normalizeString(entry.from ?? entry.alias ?? entry.specifier).trim(), normalizeImportAliasTarget(entry.to ?? entry.path));
    }
  }
  for (const [key, value] of aliases) {
    if (!key || !value) aliases.delete(key);
  }
  return aliases;
}

function aliasesFromImportMap(importMap = {}) {
  const aliases = new Map();
  const imports = importMap && typeof importMap.imports === 'object' && !Array.isArray(importMap.imports)
    ? importMap.imports
    : {};
  for (const [key, value] of Object.entries(imports)) {
    const rawValue = normalizeImportAliasTarget(value);
    if (!rawValue) continue;
    aliases.set(key, rawValue);
  }
  return aliases;
}

function mergeAliasMaps(...maps) {
  const aliases = new Map();
  for (const map of maps) {
    for (const [key, value] of map instanceof Map ? map : []) {
      if (key && value) aliases.set(key, value);
    }
  }
  return aliases;
}

function parseHtmlAttributes(rawAttributes) {
  const attrs = new Map();
  const pattern = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = pattern.exec(utils_normalizeString(rawAttributes)))) {
    attrs.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

function parseHtmlEntry(source) {
  const html = utils_normalizeString(source);
  const importMaps = [];
  const moduleScriptSrcs = [];
  const importMapPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = importMapPattern.exec(html))) {
    const attrs = parseHtmlAttributes(match[1]);
    const type = utils_normalizeString(attrs.get('type')).trim().toLowerCase();
    const src = utils_normalizeString(attrs.get('src')).trim();
    if (type === 'importmap') {
      try {
        importMaps.push(JSON.parse(match[2]));
      } catch (error) {
        throw new Error(`Invalid HTML import map JSON: ${error.message}`);
      }
    } else if (type === 'module' && src) {
      moduleScriptSrcs.push(src);
    }
  }
  return {
    importAliases: mergeAliasMaps(...importMaps.map(aliasesFromImportMap)),
    moduleScriptSrcs,
  };
}

async function loadImportAliases(rootDir, entryRel = '') {
  const aliases = new Map();
  const htmlCandidates = [
    external_node_path_namespaceObject.join(rootDir, 'index.html'),
    entryRel ? external_node_path_namespaceObject.join(rootDir, external_node_path_namespaceObject.posix.dirname(toPosixPath(entryRel)), 'index.html') : '',
  ].filter(Boolean);

  for (const htmlPath of htmlCandidates) {
    try {
      const html = await promises_namespaceObject.readFile(htmlPath, 'utf8');
      for (const [key, value] of parseHtmlEntry(html).importAliases) aliases.set(key, value);
    } catch {
      // best effort only
    }
  }
  return aliases;
}

function parseRouteAliasString(value) {
  const raw = utils_normalizeString(value).trim();
  const separatorIndex = raw.indexOf('=');
  if (separatorIndex === -1) {
    throw new Error(`Invalid route alias "${raw}". Use route=path.`);
  }
  return {
    from: raw.slice(0, separatorIndex),
    to: raw.slice(separatorIndex + 1),
  };
}

function routeAliasEntries(routeAliases) {
  const entries = Array.isArray(routeAliases) ? routeAliases : [routeAliases].filter(Boolean);
  return entries.map((entry) => (typeof entry === 'string' ? parseRouteAliasString(entry) : entry));
}

function normalizeRouteAliasFrom(value) {
  const raw = toPosixPath(utils_normalizeString(value).trim());
  if (!raw) return '';
  const rooted = raw.startsWith('/') ? raw : `/${raw}`;
  return rooted.replace(/\/+$/g, '') || '/';
}

function normalizeRouteAliasTarget(value) {
  const raw = toPosixPath(utils_normalizeString(value).trim());
  if (!raw) return '';
  const normalized = raw.replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/g, '');
  return normalized === '.' ? '' : normalized;
}

function normalizeRouteAliases(routeAliases = []) {
  return routeAliasEntries(routeAliases)
    .map((entry, index) => {
      const from = normalizeRouteAliasFrom(Array.isArray(entry) ? entry[0] : entry?.from);
      const targetSource = Array.isArray(entry) ? entry[1] : entry?.to;
      const to = normalizeRouteAliasTarget(targetSource);
      if (!from || targetSource == null) {
        throw new Error('Route aliases must include a route and target path.');
      }
      return { from, to, index };
    })
    .sort((a, b) => b.from.length - a.from.length || a.index - b.index)
    .map(({ from, to }) => ({ from, to }));
}

function expandImportAliasTarget(value) {
  return toPosixPath(utils_normalizeString(value).trim())
    .replace('__REVIEW_ORIGIN__/', 'public/');
}

function joinImportAliasPrefixTarget(target, rest) {
  const normalizedTarget = toPosixPath(utils_normalizeString(target).trim());
  const normalizedRest = toPosixPath(utils_normalizeString(rest).trim());
  if (!normalizedRest) return normalizedTarget;
  return normalizedTarget.endsWith('/')
    ? `${normalizedTarget}${normalizedRest}`
    : external_node_path_namespaceObject.posix.join(normalizedTarget, normalizedRest);
}

function importAliasTargetForSpecifier(specifier, aliases) {
  const raw = utils_normalizeString(specifier).trim();
  let best = null;
  for (const [key, value] of aliases instanceof Map ? aliases : []) {
    const alias = utils_normalizeString(key).trim();
    if (!alias) continue;
    if (raw === alias) {
      const candidate = { key: alias, target: value, rest: '' };
      if (!best || candidate.key.length > best.key.length) best = candidate;
    } else if (alias.endsWith('/') && raw.startsWith(alias)) {
      const candidate = { key: alias, target: value, rest: raw.slice(alias.length) };
      if (!best || candidate.key.length > best.key.length) best = candidate;
    }
  }
  return best ? joinImportAliasPrefixTarget(best.target, best.rest) : '';
}

function remoteAliasTargetForSpecifier(specifier, aliases) {
  const aliasTarget = importAliasTargetForSpecifier(specifier, aliases);
  return isRemoteSpecifier(aliasTarget) ? aliasTarget : '';
}

async function resolveFromRoot(rootDir, relativePath) {
  for (const candidate of extensionCandidates(relativePath)) {
    const filePath = external_node_path_namespaceObject.resolve(rootDir, candidate);
    if (!isWithinPath(rootDir, filePath)) continue;
    if (await fileExists(filePath)) {
      return {
        rel: toPosixPath(external_node_path_namespaceObject.relative(rootDir, filePath)),
        filePath,
      };
    }
  }
  return null;
}

async function resolveExactFromRoot(rootDir, relativePath) {
  const normalized = toPosixPath(utils_normalizeString(relativePath).trim()).replace(/^\.\//, '').replace(/^\/+/, '');
  if (!normalized) return null;
  const filePath = external_node_path_namespaceObject.resolve(rootDir, normalized);
  if (!isWithinPath(rootDir, filePath)) return null;
  if (!await fileExists(filePath)) return null;
  return {
    rel: toPosixPath(external_node_path_namespaceObject.relative(rootDir, filePath)),
    filePath,
  };
}

async function resolveEntry(rootDir, entry, { allowHtml = true } = {}) {
  const requested = utils_normalizeString(entry).trim();
  const candidates = requested ? [requested] : DEFAULT_ENTRY_CANDIDATES;
  for (const candidate of candidates) {
    const normalized = candidate.replace(/^\.\//, '').replace(/^\//, '');
    const ext = external_node_path_namespaceObject.posix.extname(toPosixPath(normalized)).toLowerCase();
    if (!allowHtml && HTML_ENTRY_EXTENSIONS.has(ext)) continue;
    const resolved = HTML_ENTRY_EXTENSIONS.has(ext)
      ? await resolveExactFromRoot(rootDir, normalized)
      : await resolveFromRoot(rootDir, normalized);
    if (!resolved) continue;
    return {
      ...resolved,
      kind: HTML_ENTRY_EXTENSIONS.has(external_node_path_namespaceObject.posix.extname(toPosixPath(resolved.rel)).toLowerCase())
        ? 'html'
        : 'module',
    };
  }
  throw new Error(`Unable to resolve browser entry inside ${rootDir}`);
}

function isAnalyzableModulePath(relativePath) {
  return ANALYZABLE_MODULE_EXTENSIONS.has(external_node_path_namespaceObject.posix.extname(toPosixPath(relativePath)).toLowerCase());
}

function localAssetKind(relativePath) {
  const normalized = toPosixPath(relativePath).toLowerCase();
  if (normalized.endsWith('.worker.js') || normalized.endsWith('.worker.mjs')) return 'worker';
  const ext = external_node_path_namespaceObject.posix.extname(normalized);
  if (!ASSET_EXTENSIONS.has(ext)) return '';
  if (ext === '.css' || ext === '.scss' || ext === '.sass' || ext === '.less') return 'style';
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico'].includes(ext)) return 'image';
  if (['.woff', '.woff2', '.ttf', '.otf'].includes(ext)) return 'font';
  if (ext === '.json') return 'json';
  if (ext === '.wasm') return 'wasm';
  return 'unknown';
}

function isSupportedBrowserModulePath(relativePath) {
  return isAnalyzableModulePath(relativePath);
}

function normalizeExclude(value) {
  return toPosixPath(utils_normalizeString(value).trim())
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/g, '');
}

function normalizeExcludes(values = []) {
  return (Array.isArray(values) ? values : [values].filter(Boolean))
    .flatMap((value) => utils_normalizeString(value).split(','))
    .map(normalizeExclude)
    .filter(Boolean)
    .sort(compareLocale);
}

function pathMatchesExclude(relativePath, excludes) {
  const rel = normalizeExclude(relativePath);
  return excludes.some((exclude) => rel === exclude || rel.startsWith(`${exclude}/`));
}

function isExcludedDiscoveryDir(name, relativePath, excludes) {
  return EXCLUDED_DISCOVERY_DIRS.has(utils_normalizeString(name).trim())
    || pathMatchesExclude(relativePath, excludes);
}

async function discoverAnalyzableModules(rootDir, moduleLimit, excludes = [], roots = ['']) {
  const discovered = new Map();

  const visit = async (dirPath) => {
    const entries = (await promises_namespaceObject.readdir(dirPath, { withFileTypes: true }))
      .sort((a, b) => compareLocale(a.name, b.name));
    for (const entry of entries) {
      const filePath = external_node_path_namespaceObject.join(dirPath, entry.name);
      const rel = toPosixPath(external_node_path_namespaceObject.relative(rootDir, filePath));
      if (entry.isDirectory()) {
        if (isExcludedDiscoveryDir(entry.name, rel, excludes)) continue;
        await visit(filePath);
      } else if (entry.isFile() && !pathMatchesExclude(rel, excludes) && isAnalyzableModulePath(rel)) {
        discovered.set(rel, { rel, filePath });
        if (discovered.size > moduleLimit) {
          throw new Error(`Module limit exceeded (${moduleLimit}).`);
        }
      }
    }
  };

  const normalizedRoots = Array.from(new Set((Array.isArray(roots) ? roots : [roots])
    .map(normalizeExclude))).sort(compareLocale);
  for (const root of normalizedRoots.length > 0 ? normalizedRoots : ['']) {
    const dirPath = external_node_path_namespaceObject.resolve(rootDir, root || '.');
    if (!isWithinPath(rootDir, dirPath)) continue;
    try {
      const stat = await promises_namespaceObject.stat(dirPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }
    await visit(dirPath);
  }
  return Array.from(discovered.values()).sort((a, b) => compareLocale(a.rel, b.rel));
}

function localPathFromRouteAlias(specifier, alias) {
  const raw = toPosixPath(utils_normalizeString(specifier).trim());
  if (!raw.startsWith('/')) return null;

  let rest = null;
  if (alias.from === '/') {
    rest = raw.replace(/^\/+/, '');
  } else if (raw === alias.from) {
    rest = '';
  } else if (raw.startsWith(`${alias.from}/`)) {
    rest = raw.slice(alias.from.length + 1);
  }

  if (rest == null) return null;
  return external_node_path_namespaceObject.posix.normalize(external_node_path_namespaceObject.posix.join(alias.to, rest));
}

async function resolveRouteAlias({ rootDir, specifier, routeAliases }) {
  for (const alias of routeAliases) {
    const localPath = localPathFromRouteAlias(specifier, alias);
    if (localPath == null) continue;
    const resolved = await resolveBrowserPathFromRoot(rootDir, localPath);
    if (resolved) return resolved;
  }
  return null;
}

function isRemoteSpecifier(specifier) {
  return /^(?:https?:)?\/\//i.test(utils_normalizeString(specifier).trim());
}

function nodeBuiltinSpecifier(specifier) {
  const raw = utils_normalizeString(specifier).trim();
  const normalized = raw.startsWith('node:') ? raw.slice('node:'.length) : raw;
  return PLATFORM_IMPORT_SPECIFIERS.has(normalized) ? normalized : '';
}

function unsupportedSourceExtension(relativePath) {
  const ext = external_node_path_namespaceObject.posix.extname(toPosixPath(relativePath)).toLowerCase();
  return UNSUPPORTED_SOURCE_EXTENSIONS.has(ext) ? ext : '';
}

async function resolveBrowserPathFromRoot(rootDir, relativePath) {
  const exact = await resolveExactFromRoot(rootDir, relativePath);
  if (exact) {
    const unsupportedExtension = unsupportedSourceExtension(exact.rel);
    if (unsupportedExtension) {
      return {
        ...exact,
        kind: 'unsupported-module',
        assetKind: null,
        unsupportedExtension,
      };
    }
    const assetKind = localAssetKind(exact.rel);
    return {
      ...exact,
      kind: isSupportedBrowserModulePath(exact.rel) ? 'module' : 'asset',
      assetKind: isSupportedBrowserModulePath(exact.rel) ? null : assetKind || 'unknown',
    };
  }
  const module = await resolveFromRoot(rootDir, relativePath);
  if (module) {
    return {
      ...module,
      kind: 'module',
      assetKind: null,
    };
  }
  return null;
}

async function resolveImport({ rootDir, specifier, importerRel, aliases, routeAliases }) {
  const raw = utils_normalizeString(specifier).trim();
  if (!raw || isRemoteSpecifier(raw) || nodeBuiltinSpecifier(raw)) return null;
  const aliasTarget = importAliasTargetForSpecifier(raw, aliases);
  if (aliasTarget) {
    const expandedAlias = expandImportAliasTarget(aliasTarget);
    if (isRemoteSpecifier(expandedAlias)) return null;
    const routedAlias = await resolveRouteAlias({ rootDir, specifier: expandedAlias, routeAliases });
    if (routedAlias) return routedAlias;
    const normalizedAlias = normalizeRouteAliasTarget(expandedAlias);
    return resolveBrowserPathFromRoot(rootDir, normalizedAlias);
  }
  if (raw.startsWith('/')) {
    return resolveRouteAlias({ rootDir, specifier: raw, routeAliases });
  }
  if (raw.startsWith('./') || raw.startsWith('../')) {
    const importerDir = external_node_path_namespaceObject.posix.dirname(toPosixPath(importerRel));
    const relativePath = external_node_path_namespaceObject.posix.normalize(external_node_path_namespaceObject.posix.join(importerDir, raw));
    return resolveBrowserPathFromRoot(rootDir, relativePath);
  }
  return null;
}

function sourceLines(source) {
  const normalized = utils_normalizeString(source);
  if (!normalized) return [];
  const lines = normalized.split(/\r\n|\r|\n/);
  if (/[\r\n]$/.test(normalized)) lines.pop();
  return lines;
}

function formatLineCount(lineCount) {
  return `${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`;
}

function scriptStats(rel, source) {
  const lines = sourceLines(source);
  return {
    path: rel,
    lineCount: lines.length,
    maxLineLength: lines.reduce((max, line) => Math.max(max, line.length), 0),
  };
}

function declarationSpansByName(record) {
  const spans = new Map();
  for (const span of declarationSpans(record)) {
    if (!spans.has(span.name)) spans.set(span.name, span);
  }
  return spans;
}

function declarationSpans(record) {
  return Array.isArray(record?.declarationSpans) ? record.declarationSpans : [];
}

function declarationSpansNamed(record, name) {
  const declarationName = normalizeIdentifier(name);
  if (!declarationName) return [];
  return declarationSpans(record)
    .filter((span) => span?.name === declarationName)
    .sort((a, b) => a.startIndex - b.startIndex
      || a.endIndex - b.endIndex
      || compareLocale(a.kind, b.kind));
}

function declarationSpanAtNameStart(record, name, nameStartIndex) {
  const declarationName = normalizeIdentifier(name);
  return declarationSpans(record).find((span) => (
    span?.name === declarationName
    && span.nameStartIndex === nameStartIndex
  )) || null;
}

function componentSpans(record) {
  return Array.from(declarationSpansByName(record))
    .filter(([name]) => /^[A-Z]/.test(name));
}

function declarationLineCount(record, name) {
  const span = declarationSpansByName(record).get(utils_normalizeString(name).trim());
  return Number.isInteger(span?.lineCount) && span.lineCount > 0 ? span.lineCount : null;
}

function escapeRegExp(value) {
  return utils_normalizeString(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeIdentifier(value) {
  const raw = utils_normalizeString(value).trim().replace(/^(?:type|typeof)\s+/, '');
  const match = raw.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
  return match ? match[0] : '';
}

function identifierListParts(text) {
  return utils_normalizeString(text)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseNamedExportSpecifier(part) {
  const cleaned = utils_normalizeString(part)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/g, '')
    .trim()
    .replace(/^(?:type|typeof)\s+/, '');
  if (!cleaned) return null;
  const aliasMatch = cleaned.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/);
  if (aliasMatch) return { local: aliasMatch[1], exported: aliasMatch[2] };
  const local = normalizeIdentifier(cleaned);
  return local ? { local, exported: local } : null;
}

function findNextNonWhitespaceIndex(text, start) {
  let index = start;
  while (index < text.length && /\s/.test(text[index])) index += 1;
  return index;
}

function findMatchingBrace(text, startIndex) {
  let depth = 0;
  for (let index = startIndex; index < text.length; index += 1) {
    if (text[index] === '{') {
      depth += 1;
    } else if (text[index] === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function analyze_project_findMatchingDelimiter(text, startIndex, openChar, closeChar) {
  let depth = 0;
  for (let index = startIndex; index < text.length; index += 1) {
    if (text[index] === openChar) {
      depth += 1;
    } else if (text[index] === closeChar) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function splitTopLevel(text, separator = ',') {
  const parts = [];
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === separator && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push({ text: text.slice(start, index), startIndex: start });
      start = index + 1;
    }
  }
  parts.push({ text: text.slice(start), startIndex: start });
  return parts;
}

function topLevelCharacterIndex(text, target) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === target && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) return index;
  }
  return -1;
}

function wordAt(text, start, word) {
  if (text.slice(start, start + word.length) !== word) return false;
  const before = text[start - 1] || '';
  const after = text[start + word.length] || '';
  return !/[A-Za-z0-9_$]/.test(before) && !/[A-Za-z0-9_$]/.test(after);
}

function namedExportListFromClauseStart(text, closeBraceIndex) {
  const fromIndex = findNextNonWhitespaceIndex(text, closeBraceIndex + 1);
  if (!wordAt(text, fromIndex, 'from')) return -1;
  const specifierIndex = findNextNonWhitespaceIndex(text, fromIndex + 'from'.length);
  return text[specifierIndex] === '"' || text[specifierIndex] === "'" ? fromIndex : -1;
}

function namedExportListEntries(masked) {
  const entries = [];
  const exportListPattern = /\bexport\s*\{/g;
  let match;
  while ((match = exportListPattern.exec(masked))) {
    const openBraceIndex = masked.indexOf('{', match.index);
    const closeBraceIndex = findMatchingBrace(masked, openBraceIndex);
    if (closeBraceIndex === -1) {
      exportListPattern.lastIndex = match.index + match[0].length;
      continue;
    }
    const fromIndex = namedExportListFromClauseStart(masked, closeBraceIndex);
    if (fromIndex === -1) {
      const semicolonIndex = findNextNonWhitespaceIndex(masked, closeBraceIndex + 1);
      entries.push({
        specifiersText: masked.slice(openBraceIndex + 1, closeBraceIndex),
        startIndex: match.index,
        endIndex: masked[semicolonIndex] === ';' ? semicolonIndex + 1 : closeBraceIndex + 1,
      });
    }
    exportListPattern.lastIndex = closeBraceIndex + 1;
  }
  return entries;
}

function declarationTargetFromSpan(declarationName, span) {
  const name = normalizeIdentifier(declarationName);
  return name && span ? { declarationName: name, span } : null;
}

function defaultExportDeclarationTarget(record) {
  const source = utils_normalizeString(record?.source);
  if (!source) return null;
  const masked = maskIgnorableSyntax(source);
  const directMatch = masked.match(/\bexport\s+default\s+(?:async\s+)?function\s*\*?\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/);
  if (directMatch) {
    const nameStartIndex = directMatch.index + directMatch[0].lastIndexOf(directMatch[1]);
    const span = declarationSpanAtNameStart(record, directMatch[1], nameStartIndex);
    const target = declarationTargetFromSpan(directMatch[1], span);
    if (target) return target;
  }
  for (const entry of namedExportListEntries(masked)) {
    for (const part of identifierListParts(entry.specifiersText)) {
      const specifier = parseNamedExportSpecifier(part);
      if (specifier?.exported !== 'default') continue;
      const span = visibleDeclarationSpanForName(record, specifier.local, {
        index: entry.startIndex,
        endIndex: entry.endIndex,
      }) || declarationSpansNamed(record, specifier.local)[0];
      const target = declarationTargetFromSpan(specifier.local, span);
      if (target) return target;
    }
  }
  const identifierMatch = masked.match(/\bexport\s+default\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/);
  if (identifierMatch) {
    const span = visibleDeclarationSpanForName(record, identifierMatch[1], {
      index: identifierMatch.index,
      endIndex: identifierMatch.index + identifierMatch[0].length,
    }) || declarationSpansNamed(record, identifierMatch[1])[0];
    const target = declarationTargetFromSpan(identifierMatch[1], span);
    if (target) return target;
  }
  return null;
}

function defaultExportDeclarationName(record) {
  const target = defaultExportDeclarationTarget(record);
  if (target) return target.declarationName;
  return '';
}

function addPublicApiSignal(info, { kind, exportedName, startIndex, endIndex }) {
  const signalKind = utils_normalizeString(kind).trim();
  const name = utils_normalizeString(exportedName).trim();
  if (signalKind && !info.exportKinds.includes(signalKind)) info.exportKinds.push(signalKind);
  if (name && !info.exportedNames.includes(name)) info.exportedNames.push(name);
  if (Number.isInteger(startIndex) && Number.isInteger(endIndex) && endIndex > startIndex) {
    info.ranges.push({ startIndex, endIndex });
  }
}

function declarationPublicApiInfo(record, declarationName) {
  const name = normalizeIdentifier(declarationName);
  const source = utils_normalizeString(record?.source);
  const masked = maskIgnorableSyntax(source);
  const info = {
    exported: false,
    exportedNames: [],
    exportKinds: [],
    ranges: [],
  };
  if (!name || !source) return info;

  const escaped = escapeRegExp(name);
  const directFunctionExportPattern = new RegExp(`\\bexport\\s+(default\\s+)?(?:async\\s+)?function\\s*\\*?\\s+${escaped}\\s*\\(`, 'g');
  const directArrowExportPattern = new RegExp(`\\bexport\\s+(?:const|let|var)\\s+${escaped}\\s*=`, 'g');
  const defaultIdentifierExportPattern = new RegExp(`\\bexport\\s+default\\s+${escaped}\\b`, 'g');

  let match;
  while ((match = directFunctionExportPattern.exec(masked))) {
    info.exported = true;
    const kind = match[1] ? 'default-export' : 'named-export';
    addPublicApiSignal(info, {
      kind,
      exportedName: match[1] ? 'default' : name,
      startIndex: match.index,
      endIndex: directFunctionExportPattern.lastIndex,
    });
  }
  while ((match = directArrowExportPattern.exec(masked))) {
    info.exported = true;
    addPublicApiSignal(info, {
      kind: 'named-export',
      exportedName: name,
      startIndex: match.index,
      endIndex: directArrowExportPattern.lastIndex,
    });
  }
  while ((match = defaultIdentifierExportPattern.exec(masked))) {
    info.exported = true;
    addPublicApiSignal(info, {
      kind: 'default-export',
      exportedName: 'default',
      startIndex: match.index,
      endIndex: defaultIdentifierExportPattern.lastIndex,
    });
  }
  for (const entry of namedExportListEntries(masked)) {
    for (const part of identifierListParts(entry.specifiersText)) {
      const specifier = parseNamedExportSpecifier(part);
      if (!specifier || specifier.local !== name) continue;
      info.exported = true;
      addPublicApiSignal(info, {
        kind: specifier.exported === 'default' ? 'default-export' : 'named-export',
        exportedName: specifier.exported,
        startIndex: entry.startIndex,
        endIndex: entry.endIndex,
      });
    }
  }
  info.exportKinds.sort(compareLocale);
  info.exportedNames.sort(compareLocale);
  return info;
}

function isDeclarationNameLocation(span, location) {
  return Number.isInteger(span?.nameStartIndex)
    && Number.isInteger(span?.nameEndIndex)
    && location?.index === span.nameStartIndex
    && location?.endIndex === span.nameEndIndex;
}

function locationInRanges(location, ranges) {
  return ranges.some((range) => (
    Number.isInteger(range?.startIndex)
    && Number.isInteger(range?.endIndex)
    && location.index >= range.startIndex
    && location.endIndex <= range.endIndex
  ));
}

function declarationSpanExclusiveEnd(span) {
  return Number.isInteger(span?.endIndex) ? span.endIndex + 1 : null;
}

function locationInsideDeclarationSpan(span, location) {
  const spanEnd = declarationSpanExclusiveEnd(span);
  return Number.isInteger(span?.startIndex)
    && Number.isInteger(spanEnd)
    && Number.isInteger(span?.nameEndIndex)
    && location?.index > span.nameEndIndex
    && location.index >= span.startIndex
    && location.endIndex <= spanEnd;
}

function locationWithinDeclarationBounds(span, location) {
  const spanEnd = declarationSpanExclusiveEnd(span);
  return Number.isInteger(span?.startIndex)
    && Number.isInteger(spanEnd)
    && Number.isInteger(location?.index)
    && Number.isInteger(location?.endIndex)
    && location.index >= span.startIndex
    && location.endIndex <= spanEnd;
}

function declarationSpanLength(span) {
  const spanEnd = declarationSpanExclusiveEnd(span);
  return Number.isInteger(span?.startIndex) && Number.isInteger(spanEnd)
    ? spanEnd - span.startIndex
    : Number.MAX_SAFE_INTEGER;
}

function innermostDeclarationSpanForLocation(record, location) {
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .filter((span) => locationInsideDeclarationSpan(span, location))
    .sort((a, b) => declarationSpanLength(a) - declarationSpanLength(b)
      || b.startIndex - a.startIndex
      || compareLocale(a.name, b.name))[0] || null;
}

function parentDeclarationSpanForSpan(record, childSpan) {
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .filter((span) => span !== childSpan && locationWithinDeclarationBounds(span, {
      index: childSpan.startIndex,
      endIndex: declarationSpanExclusiveEnd(childSpan),
    }))
    .sort((a, b) => declarationSpanLength(a) - declarationSpanLength(b)
      || b.startIndex - a.startIndex
      || compareLocale(a.name, b.name))[0] || null;
}

function locationOwnedByDeclaration(record, span, location) {
  return innermostDeclarationSpanForLocation(record, location) === span;
}

function isAnyDeclarationNameLocation(record, location) {
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .some((span) => isDeclarationNameLocation(span, location));
}

function declarationIdentifierMetrics(record, span, publicApiInfo) {
  const locations = cachedIdentifierReferenceLocations(record, span?.name);
  const declarationLocations = locations.filter((location) => isDeclarationNameLocation(span, location));
  const nonDeclarationLocations = locations.filter((location) => !isDeclarationNameLocation(span, location));
  const publicApiLocations = nonDeclarationLocations
    .filter((location) => locationInRanges(location, publicApiInfo.ranges));
  const publicApiIndexes = new Set(publicApiLocations.map((location) => `${location.index}:${location.endIndex}`));
  const ownDeclarationLocations = nonDeclarationLocations
    .filter((location) => locationInsideDeclarationSpan(span, location));
  const ownDeclarationIndexes = new Set(ownDeclarationLocations.map((location) => `${location.index}:${location.endIndex}`));
  const sameFileLocations = nonDeclarationLocations
    .filter((location) => {
      const key = `${location.index}:${location.endIndex}`;
      return !publicApiIndexes.has(key) && !ownDeclarationIndexes.has(key);
    });

  return {
    identifierOccurrenceCount: locations.length,
    declarationNameOccurrenceCount: declarationLocations.length,
    ownDeclarationReferenceCount: ownDeclarationLocations.length,
    declarationOnlyNameOccurrence: locations.length === declarationLocations.length + ownDeclarationLocations.length,
    sameFileReferenceCount: sameFileLocations.length,
    publicApiReferenceCount: publicApiLocations.length,
  };
}

function topLevelWordIndex(text, word) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index <= text.length - word.length; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0) continue;
    if (text.slice(index, index + word.length) !== word) continue;
    const before = text[index - 1] || '';
    const after = text[index + word.length] || '';
    if (!/[A-Za-z0-9_$]/.test(before) && !/[A-Za-z0-9_$]/.test(after)) return index;
  }
  return -1;
}

function topLevelBindingPatternText(text) {
  const cutIndexes = [
    topLevelCharacterIndex(text, '='),
    topLevelWordIndex(text, 'of'),
    topLevelWordIndex(text, 'in'),
  ].filter((index) => index >= 0);
  const endIndex = cutIndexes.length > 0 ? Math.min(...cutIndexes) : text.length;
  return text.slice(0, endIndex).replace(/^\s*\.\.\./, '');
}

function bindingIdentifierLocations(pattern, absoluteStart, identifier) {
  const bindingPattern = topLevelBindingPatternText(utils_normalizeString(pattern));
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  const escaped = escapeRegExp(name);
  const namePattern = new RegExp(`(?<![A-Za-z0-9_$])${escaped}(?![A-Za-z0-9_$])`, 'g');
  const locations = [];
  let match;
  while ((match = namePattern.exec(bindingPattern))) {
    const nextIndex = findNextNonWhitespaceIndex(bindingPattern, match.index + match[0].length);
    if (bindingPattern[nextIndex] === ':') continue;
    locations.push({
      name,
      index: absoluteStart + match.index,
      endIndex: absoluteStart + match.index + match[0].length,
    });
  }
  return locations;
}

function findTopLevelArrowIndex(text, start, end) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < end - 1; index += 1) {
    const char = text[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    if (
      char === '='
      && text[index + 1] === '>'
      && parenDepth === 0
      && bracketDepth === 0
      && braceDepth === 0
    ) {
      return index;
    }
  }
  return -1;
}

function declarationParameterRange(record, span) {
  const masked = maskIgnorableSyntax(record?.source);
  if (span?.kind === 'function') {
    const parametersStart = masked.indexOf('(', span.nameEndIndex);
    if (parametersStart === -1) return null;
    const parametersEnd = analyze_project_findMatchingDelimiter(masked, parametersStart, '(', ')');
    return parametersEnd === -1 ? null : {
      startIndex: parametersStart + 1,
      endIndex: parametersEnd,
    };
  }
  if (span?.kind !== 'arrow') return null;
  const spanEnd = declarationSpanExclusiveEnd(span);
  const equalsIndex = masked.indexOf('=', span.nameEndIndex);
  if (equalsIndex === -1 || equalsIndex >= spanEnd) return null;
  const arrowIndex = findTopLevelArrowIndex(masked, equalsIndex + 1, spanEnd);
  if (arrowIndex === -1) return null;
  let parametersStart = findNextNonWhitespaceIndex(masked, equalsIndex + 1);
  if (wordAt(masked, parametersStart, 'async')) {
    parametersStart = findNextNonWhitespaceIndex(masked, parametersStart + 'async'.length);
  }
  if (masked[parametersStart] === '(') {
    const parametersEnd = analyze_project_findMatchingDelimiter(masked, parametersStart, '(', ')');
    if (parametersEnd !== -1 && parametersEnd <= arrowIndex) {
      return {
        startIndex: parametersStart + 1,
        endIndex: parametersEnd,
      };
    }
  }
  return {
    startIndex: parametersStart,
    endIndex: arrowIndex,
  };
}

function parameterBindingLocations(record, span, identifier) {
  const range = declarationParameterRange(record, span);
  if (!range) return [];
  const masked = maskIgnorableSyntax(record?.source);
  const parameters = masked.slice(range.startIndex, range.endIndex);
  const locations = [];
  for (const part of splitTopLevel(parameters)) {
    locations.push(...bindingIdentifierLocations(
      part.text,
      range.startIndex + part.startIndex,
      identifier,
    ).map((location) => ({ ...location, kind: 'parameter' })));
  }
  return locations;
}

function findStatementEnd(masked, start, limit) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < limit; index += 1) {
    const char = masked[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === ';' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) return index + 1;
  }
  return limit;
}

function wordBeforeIndex(masked, index) {
  const endIndex = previousNonWhitespaceIndex(masked, index);
  if (endIndex === -1 || !/[A-Za-z_$]/.test(masked[endIndex])) return '';
  let startIndex = endIndex;
  while (startIndex > 0 && /[A-Za-z0-9_$]/.test(masked[startIndex - 1])) startIndex -= 1;
  return masked.slice(startIndex, endIndex + 1);
}

function shouldTreatBraceAsLexicalBlock(masked, openIndex) {
  const previousIndex = previousNonWhitespaceIndex(masked, openIndex);
  if (previousIndex === -1) return true;
  if (')>;{'.includes(masked[previousIndex])) return true;
  return ['do', 'else', 'finally', 'try'].includes(wordBeforeIndex(masked, openIndex));
}

function lexicalBlockRanges(record) {
  if (!record || typeof record !== 'object') return [];
  if (lexicalBlockRangeCache.has(record)) return lexicalBlockRangeCache.get(record);
  const masked = maskIgnorableSyntax(record?.source);
  const ranges = [];
  const seen = new Set();
  const add = (startIndex, endIndex) => {
    if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex) || endIndex <= startIndex) return;
    const key = `${startIndex}:${endIndex}`;
    if (seen.has(key)) return;
    seen.add(key);
    ranges.push({ startIndex, endIndex });
  };

  for (let index = 0; index < masked.length; index += 1) {
    if (masked[index] !== '{' || !shouldTreatBraceAsLexicalBlock(masked, index)) continue;
    const closeIndex = findMatchingBrace(masked, index);
    if (closeIndex !== -1) add(index, closeIndex + 1);
  }

  ranges.sort((a, b) => (a.endIndex - a.startIndex) - (b.endIndex - b.startIndex)
    || b.startIndex - a.startIndex);
  lexicalBlockRangeCache.set(record, ranges);
  return ranges;
}

function canEndStatementAtIndex(text, index) {
  const char = text[index];
  if (/[A-Za-z0-9_$]/.test(char) || ')]}"\'`'.includes(char)) return true;
  return (char === '+' || char === '-') && text[index - 1] === char;
}

function statementContinuationStarts(text, index) {
  const char = text[index];
  if (!char) return false;
  return '`([{.,?:+-*/%&|^<>=!~'.includes(char);
}

function analyze_project_hasLineTerminatorBetween(text, start, end) {
  for (let index = start; index < end; index += 1) {
    if (text[index] === '\n' || text[index] === '\r') return true;
  }
  return false;
}

function identifierEndIndex(text, start) {
  if (!/[A-Za-z_$]/.test(text[start] || '')) return start;
  let index = start + 1;
  while (index < text.length && /[A-Za-z0-9_$]/.test(text[index])) index += 1;
  return index;
}

function templateLiteralEndIndex(text, start, limit) {
  let index = start + 1;
  let expressionDepth = 0;
  while (index < limit) {
    const char = text[index];
    if (char === '`' && expressionDepth === 0) return index + 1;
    if (char === '$' && text[index + 1] === '{' && expressionDepth === 0) {
      expressionDepth = 1;
      index += 2;
      continue;
    }
    if (expressionDepth > 0) {
      if (char === '`') {
        index = templateLiteralEndIndex(text, index, limit);
        continue;
      }
      if (char === '{') expressionDepth += 1;
      else if (char === '}') expressionDepth -= 1;
    }
    index += 1;
  }
  return limit;
}

function expressionStatementEndIndex(masked, start, limit) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let lastNonWhitespace = start;
  for (let index = start; index < limit; index += 1) {
    const char = masked[index];
    if (!/\s/.test(char)) lastNonWhitespace = index;
    if (char === '`') {
      index = templateLiteralEndIndex(masked, index, limit) - 1;
      lastNonWhitespace = Math.max(lastNonWhitespace, index);
    } else if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') {
      if (braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) return Math.max(start, lastNonWhitespace);
      braceDepth = Math.max(0, braceDepth - 1);
    } else if (char === ';' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return index + 1;
    } else if (
      (char === '\n' || char === '\r')
      && parenDepth === 0
      && bracketDepth === 0
      && braceDepth === 0
      && lastNonWhitespace >= start
      && canEndStatementAtIndex(masked, lastNonWhitespace)
    ) {
      const nextIndex = findNextNonWhitespaceIndex(masked, index + 1);
      if (!statementContinuationStarts(masked, nextIndex)) return lastNonWhitespace + 1;
    }
  }
  return Math.min(limit, lastNonWhitespace + 1);
}

function conditionEndAfterKeyword(masked, keywordEnd, limit) {
  const conditionStart = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (conditionStart >= limit || masked[conditionStart] !== '(') return -1;
  return analyze_project_findMatchingDelimiter(masked, conditionStart, '(', ')');
}

function bracedBlockEndIndex(masked, blockStart, limit) {
  const start = findNextNonWhitespaceIndex(masked, blockStart);
  if (start >= limit || masked[start] !== '{') return -1;
  const end = findMatchingBrace(masked, start);
  return end === -1 ? -1 : end + 1;
}

function controlStatementWithConditionEnd(masked, keywordEnd, limit) {
  const conditionEnd = conditionEndAfterKeyword(masked, keywordEnd, limit);
  if (conditionEnd === -1) return expressionStatementEndIndex(masked, keywordEnd, limit);
  return singleStatementEndIndex(masked, findNextNonWhitespaceIndex(masked, conditionEnd + 1), limit);
}

function ifStatementEndIndex(masked, start, limit) {
  const conditionEnd = conditionEndAfterKeyword(masked, start + 'if'.length, limit);
  if (conditionEnd === -1) return expressionStatementEndIndex(masked, start, limit);
  let end = singleStatementEndIndex(masked, findNextNonWhitespaceIndex(masked, conditionEnd + 1), limit);
  const elseIndex = findNextNonWhitespaceIndex(masked, end);
  if (wordAt(masked, elseIndex, 'else')) {
    end = singleStatementEndIndex(masked, findNextNonWhitespaceIndex(masked, elseIndex + 'else'.length), limit);
  }
  return end;
}

function tryStatementEndIndex(masked, start, limit) {
  let end = bracedBlockEndIndex(masked, start + 'try'.length, limit);
  if (end === -1) return expressionStatementEndIndex(masked, start, limit);
  let nextIndex = findNextNonWhitespaceIndex(masked, end);
  if (wordAt(masked, nextIndex, 'catch')) {
    const conditionEnd = conditionEndAfterKeyword(masked, nextIndex + 'catch'.length, limit);
    const catchBlockStart = conditionEnd === -1
      ? findNextNonWhitespaceIndex(masked, nextIndex + 'catch'.length)
      : findNextNonWhitespaceIndex(masked, conditionEnd + 1);
    const catchEnd = bracedBlockEndIndex(masked, catchBlockStart, limit);
    if (catchEnd !== -1) end = catchEnd;
  }
  nextIndex = findNextNonWhitespaceIndex(masked, end);
  if (wordAt(masked, nextIndex, 'finally')) {
    const finallyEnd = bracedBlockEndIndex(masked, nextIndex + 'finally'.length, limit);
    if (finallyEnd !== -1) end = finallyEnd;
  }
  return end;
}

function doStatementEndIndex(masked, start, limit) {
  const bodyStart = findNextNonWhitespaceIndex(masked, start + 'do'.length);
  const bodyEnd = singleStatementEndIndex(masked, bodyStart, limit);
  const whileIndex = findNextNonWhitespaceIndex(masked, bodyEnd);
  if (!wordAt(masked, whileIndex, 'while')) return bodyEnd;
  const conditionEnd = conditionEndAfterKeyword(masked, whileIndex + 'while'.length, limit);
  if (conditionEnd === -1) return expressionStatementEndIndex(masked, whileIndex, limit);
  const semicolonIndex = findNextNonWhitespaceIndex(masked, conditionEnd + 1);
  return masked[semicolonIndex] === ';' ? semicolonIndex + 1 : conditionEnd + 1;
}

function restrictedExpressionStatementEndIndex(masked, start, keyword, limit) {
  const keywordEnd = start + keyword.length;
  const nextIndex = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (analyze_project_hasLineTerminatorBetween(masked, keywordEnd, nextIndex)) return keywordEnd;
  const semicolonIndex = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (masked[semicolonIndex] === ';') return semicolonIndex + 1;
  return expressionStatementEndIndex(masked, start, limit);
}

function restrictedJumpStatementEndIndex(masked, start, keyword, limit) {
  const keywordEnd = start + keyword.length;
  const nextIndex = findNextNonWhitespaceIndex(masked, keywordEnd);
  if (analyze_project_hasLineTerminatorBetween(masked, keywordEnd, nextIndex)) return keywordEnd;
  if (masked[nextIndex] === ';') return nextIndex + 1;
  const labelEnd = identifierEndIndex(masked, nextIndex);
  if (labelEnd > nextIndex) {
    const afterLabel = findNextNonWhitespaceIndex(masked, labelEnd);
    return masked[afterLabel] === ';' ? afterLabel + 1 : labelEnd;
  }
  return keywordEnd;
}

function loopHeaderBoundsAt(masked, forIndex, limit) {
  if (!wordAt(masked, forIndex, 'for')) return null;
  let headerStart = findNextNonWhitespaceIndex(masked, forIndex + 'for'.length);
  if (wordAt(masked, headerStart, 'await')) {
    headerStart = findNextNonWhitespaceIndex(masked, headerStart + 'await'.length);
  }
  if (headerStart >= limit || masked[headerStart] !== '(') return null;
  const headerEnd = analyze_project_findMatchingDelimiter(masked, headerStart, '(', ')');
  if (headerEnd === -1) return null;
  return {
    headerStartIndex: headerStart,
    headerEndIndex: headerEnd + 1,
    bodyStartIndex: findNextNonWhitespaceIndex(masked, headerEnd + 1),
  };
}

function loopBodyEndIndex(masked, bodyStart, limit) {
  if (bodyStart >= limit) return limit;
  if (masked[bodyStart] === '{') {
    const closeIndex = findMatchingBrace(masked, bodyStart);
    return closeIndex === -1 ? limit : closeIndex + 1;
  }
  if (masked[bodyStart] === ';') return bodyStart + 1;
  return singleStatementEndIndex(masked, bodyStart, limit);
}

function loopEndIndexAt(masked, forIndex, limit) {
  const bounds = loopHeaderBoundsAt(masked, forIndex, limit);
  if (!bounds) return expressionStatementEndIndex(masked, forIndex, limit);
  return loopBodyEndIndex(masked, bounds.bodyStartIndex, limit);
}

function singleStatementEndIndex(masked, start, limit) {
  const statementStart = findNextNonWhitespaceIndex(masked, start);
  if (statementStart >= limit) return limit;
  if (masked[statementStart] === '{') {
    const closeIndex = findMatchingBrace(masked, statementStart);
    return closeIndex === -1 ? limit : closeIndex + 1;
  }
  if (masked[statementStart] === ';') return statementStart + 1;
  if (wordAt(masked, statementStart, 'if')) return ifStatementEndIndex(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'for')) return loopEndIndexAt(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'while')) {
    return controlStatementWithConditionEnd(masked, statementStart + 'while'.length, limit);
  }
  if (wordAt(masked, statementStart, 'with')) {
    return controlStatementWithConditionEnd(masked, statementStart + 'with'.length, limit);
  }
  if (wordAt(masked, statementStart, 'switch')) {
    const conditionEnd = conditionEndAfterKeyword(masked, statementStart + 'switch'.length, limit);
    const blockEnd = conditionEnd === -1
      ? -1
      : bracedBlockEndIndex(masked, conditionEnd + 1, limit);
    return blockEnd === -1 ? expressionStatementEndIndex(masked, statementStart, limit) : blockEnd;
  }
  if (wordAt(masked, statementStart, 'try')) return tryStatementEndIndex(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'do')) return doStatementEndIndex(masked, statementStart, limit);
  if (wordAt(masked, statementStart, 'return')) {
    return restrictedExpressionStatementEndIndex(masked, statementStart, 'return', limit);
  }
  if (wordAt(masked, statementStart, 'throw')) {
    return restrictedExpressionStatementEndIndex(masked, statementStart, 'throw', limit);
  }
  if (wordAt(masked, statementStart, 'yield')) {
    return restrictedExpressionStatementEndIndex(masked, statementStart, 'yield', limit);
  }
  if (wordAt(masked, statementStart, 'break')) {
    return restrictedJumpStatementEndIndex(masked, statementStart, 'break', limit);
  }
  if (wordAt(masked, statementStart, 'continue')) {
    return restrictedJumpStatementEndIndex(masked, statementStart, 'continue', limit);
  }
  return expressionStatementEndIndex(masked, statementStart, limit);
}

function loopScopeRanges(record) {
  if (!record || typeof record !== 'object') return [];
  if (loopScopeRangeCache.has(record)) return loopScopeRangeCache.get(record);
  const masked = maskIgnorableSyntax(record?.source);
  const ranges = [];
  const forPattern = /\bfor\b/g;
  let match;
  while ((match = forPattern.exec(masked))) {
    const bounds = loopHeaderBoundsAt(masked, match.index, masked.length);
    if (!bounds) continue;
    const endIndex = loopBodyEndIndex(masked, bounds.bodyStartIndex, masked.length);
    ranges.push({
      startIndex: match.index,
      headerStartIndex: bounds.headerStartIndex,
      headerEndIndex: bounds.headerEndIndex,
      endIndex,
    });
  }
  ranges.sort((a, b) => (a.endIndex - a.startIndex) - (b.endIndex - b.startIndex)
    || b.startIndex - a.startIndex);
  loopScopeRangeCache.set(record, ranges);
  return ranges;
}

function nearestLexicalBlockForLocation(record, location, ownerSpan) {
  const ownerEnd = declarationSpanExclusiveEnd(ownerSpan);
  return lexicalBlockRanges(record).find((range) => (
    location.index >= range.startIndex
    && location.endIndex <= range.endIndex
    && (!ownerSpan || (
      range.startIndex >= ownerSpan.startIndex
      && range.endIndex <= ownerEnd
    ))
  )) || null;
}

function loopHeaderRangeForLocation(record, location, ownerSpan) {
  const ownerEnd = declarationSpanExclusiveEnd(ownerSpan);
  return loopScopeRanges(record).find((range) => (
    location.index > range.headerStartIndex
    && location.endIndex <= range.headerEndIndex
    && (!ownerSpan || (
      range.startIndex >= ownerSpan.startIndex
      && range.endIndex <= ownerEnd
    ))
  )) || null;
}

function loopHeaderScopeForLocation(record, location, ownerSpan) {
  return loopHeaderRangeForLocation(record, location, ownerSpan);
}

function spanScope(span) {
  return {
    scopeStart: span?.startIndex,
    scopeEnd: declarationSpanExclusiveEnd(span),
  };
}

function blockScopedBindingScope(record, ownerSpan, location) {
  const loopScope = loopHeaderScopeForLocation(record, location, ownerSpan);
  if (loopScope) {
    return {
      scopeStart: loopScope.startIndex,
      scopeEnd: loopScope.endIndex,
    };
  }
  const block = nearestLexicalBlockForLocation(record, location, ownerSpan);
  return block ? {
    scopeStart: block.startIndex,
    scopeEnd: block.endIndex,
  } : spanScope(ownerSpan);
}

function functionScopedBindingScope(ownerSpan) {
  return spanScope(ownerSpan);
}

function loopHeaderDeclarationEnd(masked, declarationStart, headerEndIndex) {
  const limit = Math.max(declarationStart, headerEndIndex - 1);
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = declarationStart; index < limit; index += 1) {
    const char = masked[index];
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === ';' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) return index;
  }
  return limit;
}

function variableStatementEndIndex(masked, declarationStart, limit) {
  return expressionStatementEndIndex(masked, declarationStart, limit);
}

function variableBindingLocations(record, span, identifier) {
  const masked = maskIgnorableSyntax(record?.source);
  const spanEnd = declarationSpanExclusiveEnd(span);
  const declarationPattern = /\b(const|let|var)\s+/g;
  const locations = [];
  let match;
  while ((match = declarationPattern.exec(masked))) {
    const keywordLocation = { index: match.index, endIndex: declarationPattern.lastIndex };
    if (!locationOwnedByDeclaration(record, span, keywordLocation)) continue;
    const declarationStart = declarationPattern.lastIndex;
    const loopHeader = loopHeaderRangeForLocation(record, keywordLocation, span);
    const statementEnd = loopHeader
      ? loopHeaderDeclarationEnd(masked, declarationStart, loopHeader.headerEndIndex)
      : variableStatementEndIndex(masked, match.index, spanEnd);
    const declarationText = masked.slice(declarationStart, statementEnd);
    for (const part of splitTopLevel(declarationText)) {
      const declaratorStart = declarationStart + part.startIndex;
      const declaratorEnd = declaratorStart + part.text.length;
      locations.push(...bindingIdentifierLocations(
        part.text,
        declaratorStart,
        identifier,
      ).filter((location) => locationOwnedByDeclaration(record, span, location))
        .map((location) => ({
          ...location,
          kind: 'variable',
          declarationKind: match[1],
          ...(match[1] === 'var'
            ? functionScopedBindingScope(span)
            : blockScopedBindingScope(record, span, location)),
          statementStart: match.index,
          statementEnd,
          declaratorStart,
          declaratorEnd,
        })));
    }
  }
  return locations;
}

function functionBindingLocations(record, span, identifier) {
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  return (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
    .filter((candidate) => candidate !== span
      && candidate.kind === 'function'
      && candidate.name === name
      && candidate.declarationType === 'function-declaration'
      && parentDeclarationSpanForSpan(record, candidate) === span)
    .map((candidate) => ({
      name,
      index: candidate.nameStartIndex,
      endIndex: candidate.nameEndIndex,
      kind: 'function',
      ...blockScopedBindingScope(record, span, {
        index: candidate.nameStartIndex,
        endIndex: candidate.nameEndIndex,
      }),
    }));
}

function classBindingLocations(record, span, identifier) {
  const masked = maskIgnorableSyntax(record?.source);
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  const classPattern = /\bclass\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/g;
  const locations = [];
  let match;
  while ((match = classPattern.exec(masked))) {
    if (match[1] !== name) continue;
    const index = match.index + match[0].lastIndexOf(match[1]);
    const location = { name, index, endIndex: index + match[1].length };
    if (locationOwnedByDeclaration(record, span, location)) {
      locations.push({
        ...location,
        kind: 'class',
        ...blockScopedBindingScope(record, span, location),
      });
    }
  }
  return locations;
}

function localBindingLocations(record, span, identifier) {
  return [
    ...parameterBindingLocations(record, span, identifier)
      .map((location) => ({ ...location, ...functionScopedBindingScope(span) })),
    ...variableBindingLocations(record, span, identifier),
    ...functionBindingLocations(record, span, identifier),
    ...classBindingLocations(record, span, identifier),
  ].sort((a, b) => a.index - b.index || a.endIndex - b.endIndex);
}

function declarationScopeChain(record, span) {
  const chain = [];
  let current = span;
  while (current) {
    chain.push(current);
    current = parentDeclarationSpanForSpan(record, current);
  }
  return chain;
}

function visibleLocalBindingLocations(record, span, identifier) {
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  if (record && typeof record === 'object') {
    if (!visibleLocalBindingLocationCache.has(record)) {
      visibleLocalBindingLocationCache.set(record, new Map());
    }
    const recordCache = visibleLocalBindingLocationCache.get(record);
    const key = [
      span?.startIndex,
      declarationSpanExclusiveEnd(span),
      name,
    ].join('\u0000');
    if (recordCache.has(key)) return recordCache.get(key);
    const bindings = visibleLocalBindingLocationsUncached(record, span, name);
    recordCache.set(key, bindings);
    return bindings;
  }
  return visibleLocalBindingLocationsUncached(record, span, name);
}

function visibleLocalBindingLocationsUncached(record, span, identifier) {
  const bindings = [];
  const seen = new Set();
  for (const scopeSpan of declarationScopeChain(record, span)) {
    for (const binding of localBindingLocations(record, scopeSpan, identifier)) {
      const key = `${binding.kind}:${binding.index}:${binding.endIndex}:${binding.scopeStart}:${binding.scopeEnd}`;
      if (seen.has(key)) continue;
      seen.add(key);
      bindings.push(binding);
    }
  }
  return bindings.sort((a, b) => (a.scopeEnd - a.scopeStart) - (b.scopeEnd - b.scopeStart)
    || b.scopeStart - a.scopeStart
    || a.index - b.index);
}

function moduleBindingScope(record) {
  return {
    scopeStart: 0,
    scopeEnd: utils_normalizeString(record?.source).length,
  };
}

function normalizedBindingScope(record, scope) {
  return Number.isInteger(scope?.scopeStart)
    && Number.isInteger(scope?.scopeEnd)
    && scope.scopeEnd >= scope.scopeStart
    ? scope
    : moduleBindingScope(record);
}

function functionExpressionNameScope(span) {
  return {
    scopeStart: span?.nameStartIndex,
    scopeEnd: declarationSpanExclusiveEnd(span),
  };
}

function declarationBindingScope(record, span) {
  const declarationType = utils_normalizeString(span?.declarationType).trim();
  if (declarationType === 'function-expression-name') {
    return normalizedBindingScope(record, functionExpressionNameScope(span));
  }
  const ownerSpan = parentDeclarationSpanForSpan(record, span);
  return normalizedBindingScope(record, blockScopedBindingScope(record, ownerSpan, {
    index: span?.nameStartIndex,
    endIndex: span?.nameEndIndex,
  }));
}

function locationInBindingScope(scope, location) {
  return Number.isInteger(scope?.scopeStart)
    && Number.isInteger(scope?.scopeEnd)
    && Number.isInteger(location?.index)
    && Number.isInteger(location?.endIndex)
    && location.index >= scope.scopeStart
    && location.endIndex <= scope.scopeEnd;
}

function visibleDeclarationSpanForName(record, name, location) {
  const candidates = declarationSpansNamed(record, name)
    .map((span) => ({ span, scope: declarationBindingScope(record, span) }))
    .filter(({ scope }) => locationInBindingScope(scope, location))
    .sort((a, b) => (a.scope.scopeEnd - a.scope.scopeStart) - (b.scope.scopeEnd - b.scope.scopeStart)
      || b.scope.scopeStart - a.scope.scopeStart
      || b.span.startIndex - a.span.startIndex
      || compareLocale(a.span.kind, b.span.kind));
  return candidates[0]?.span || null;
}

function sameLocation(a, b) {
  return a?.index === b?.index && a?.endIndex === b?.endIndex;
}

function cachedIdentifierReferenceLocations(record, identifier) {
  const name = normalizeIdentifier(identifier);
  if (!name) return [];
  if (!record || typeof record !== 'object') return identifierReferenceLocations(record?.source, name);
  if (!identifierReferenceLocationCache.has(record)) {
    identifierReferenceLocationCache.set(record, new Map());
  }
  const recordCache = identifierReferenceLocationCache.get(record);
  if (!recordCache.has(name)) {
    recordCache.set(name, identifierReferenceLocations(record.source, name));
  }
  return recordCache.get(name);
}

function locationInTypeOnlyRange(record, location) {
  const ranges = Array.isArray(record?.typeOnlyRanges) ? record.typeOnlyRanges : [];
  return ranges.some((range) => (
    Number.isInteger(range?.startIndex)
    && Number.isInteger(range?.endIndex)
    && Number.isInteger(location?.index)
    && Number.isInteger(location?.endIndex)
    && location.index >= range.startIndex
    && location.endIndex <= range.endIndex
  ));
}

function lineStartIndexesForSource(source) {
  const text = utils_normalizeString(source);
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') starts.push(index + 1);
  }
  return starts;
}

function sourceColumnAtIndex(source, index) {
  if (!Number.isInteger(index) || index < 0) return null;
  const text = utils_normalizeString(source);
  const lineStart = text.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  return index - lineStart + 1;
}

function lineNumberAtSourceIndex(source, index) {
  if (!Number.isInteger(index) || index < 0) return null;
  const starts = lineStartIndexesForSource(source);
  let low = 0;
  let high = starts.length - 1;
  let found = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (starts[mid] <= index) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found + 1;
}

function analyze_project_unescapeStringLiteralValue(value) {
  return utils_normalizeString(value).replace(/\\(['"\\])/g, '$1');
}

function stringLiteralExpressionValue(expression) {
  const match = utils_normalizeString(expression).trim().match(/^(['"])((?:\\.|(?!\1)[\s\S])*?)\1$/);
  return match ? analyze_project_unescapeStringLiteralValue(match[2]) : '';
}

function stringConstantValues(record) {
  if (!record || typeof record !== 'object') return new Map();
  if (stringConstantValueCache.has(record)) return stringConstantValueCache.get(record);
  const source = utils_normalizeString(record?.source);
  const masked = maskIgnorableSyntax(source);
  const constants = new Map();
  const pattern = /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(['"])((?:\\.|(?!\2)[\s\S])*?)\2/g;
  let match;
  while ((match = pattern.exec(source))) {
    if (!/\S/.test(masked[match.index] || '')) continue;
    constants.set(match[1], analyze_project_unescapeStringLiteralValue(match[3]));
  }
  stringConstantValueCache.set(record, constants);
  return constants;
}

function specifierExpressionMatchesRef(record, expression, specifier) {
  const text = utils_normalizeString(expression).trim();
  if (!text) return false;
  const literalValue = stringLiteralExpressionValue(text);
  if (literalValue) return literalValue === specifier;
  const identifierMatch = text.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
  return Boolean(identifierMatch) && stringConstantValues(record).get(text) === specifier;
}

function declarationSpecifierMatchesRef(record, declaration, specifier) {
  const specifierExpression = `(['"](?:\\\\.|[^'"])*['"]|[A-Za-z_$][A-Za-z0-9_$]*)`;
  const callPattern = new RegExp(`\\b(?:import|window\\.import)\\s*\\(\\s*${specifierExpression}\\s*\\)`, 'g');
  let match;
  while ((match = callPattern.exec(declaration))) {
    if (specifierExpressionMatchesRef(record, match[1], specifier)) return true;
  }
  return false;
}

function localBindingDeclarationSource(record, localBinding) {
  const source = utils_normalizeString(record?.source);
  const start = Number.isInteger(localBinding?.declaratorStart)
    ? localBinding.declaratorStart
    : localBinding?.statementStart;
  const end = Number.isInteger(localBinding?.declaratorEnd)
    ? localBinding.declaratorEnd
    : localBinding?.statementEnd;
  if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start) return '';
  return source.slice(start, end);
}

function localBindingIsImportDeclaration(record, localBinding, binding, ref) {
  if (
    localBinding?.kind !== 'variable'
    || normalizeIdentifier(binding?.local) !== normalizeIdentifier(localBinding.name)
  ) {
    return false;
  }
  const declaration = localBindingDeclarationSource(record, localBinding);
  const maskedDeclaration = maskIgnorableSyntax(declaration);
  const refKind = utils_normalizeString(ref?.kind).trim();
  if (refKind === 'dynamic') {
    const loaderPattern = /\b(?:import|window\.import)\s*\(/;
    const specifier = utils_normalizeString(ref?.specifier).trim();
    return Boolean(specifier)
      && loaderPattern.test(maskedDeclaration)
      && declarationSpecifierMatchesRef(record, declaration, specifier);
  }
  if (refKind === 'lazy' && binding?.inferred) {
    const imported = escapeRegExp(normalizeIdentifier(binding.imported));
    return imported ? new RegExp(`\\.\\s*${imported}\\b`).test(declaration) : false;
  }
  return false;
}

function isShadowedReferenceLocation(record, span, identifier, location, {
  binding,
  ref,
  ignoredBindingLocations = [],
} = {}) {
  for (const localBinding of visibleLocalBindingLocations(record, span, identifier)) {
    if (ignoredBindingLocations.some((ignored) => sameLocation(localBinding, ignored))) continue;
    if (sameLocation(localBinding, location)) return true;
    if (
      Number.isInteger(localBinding.scopeStart)
      && Number.isInteger(localBinding.scopeEnd)
      && location.index >= localBinding.scopeStart
      && location.endIndex <= localBinding.scopeEnd
    ) {
      return !localBindingIsImportDeclaration(record, localBinding, binding, ref);
    }
  }
  return false;
}

function declarationSnippet(record, span) {
  const lines = sourceLines(record?.source);
  if (
    !span
    || !Number.isInteger(span.startLine)
    || !Number.isInteger(span.endLine)
    || span.startLine < 1
    || span.endLine < span.startLine
    || span.endLine > lines.length
  ) {
    return '';
  }
  return lines.slice(span.startLine - 1, span.endLine).join('\n');
}

function sourceDeclarationEntry({
  moduleId,
  visibleName,
  record,
  span,
  declarationName = visibleName,
  sourceOrigin,
  metrics = emptyDeclarationImportMetrics(),
  relationships = emptyDeclarationRelationships(),
  functionNode = null,
}) {
  const code = declarationSnippet(record, span);
  if (!moduleId || !visibleName || !record?.rel || !code) return null;
  return {
    moduleId,
    modulePath: record.rel,
    name: visibleName,
    declarationName,
    kind: span.kind,
    startLine: span.startLine,
    endLine: span.endLine,
    code,
    sourceOrigin,
    referenceCount: metrics.referenceCount,
    sameFileReferenceCount: metrics.sameFileReferenceCount,
    incomingReferenceCount: metrics.incomingReferenceCount,
    directIdentifierReferenceCount: metrics.directIdentifierReferenceCount,
    importerFileCount: metrics.importerFileCount,
    importedFunctionUses: Array.isArray(relationships.importedFunctionUses)
      ? relationships.importedFunctionUses
      : [],
    importedBy: Array.isArray(relationships.importedBy) ? relationships.importedBy : [],
    ...(functionNode ? {
      functionId: functionNode.id,
      functionStableId: functionNode.stableId || null,
      functionScopePath: functionNode.scopePath || '',
      placement: functionNode.placement || null,
    } : {}),
  };
}

function emptyDeclarationRelationships() {
  return {
    importedFunctionUses: [],
    importedBy: [],
  };
}

function emptyDeclarationImportMetrics() {
  return {
    referenceCount: 0,
    directIdentifierReferenceCount: 0,
    sameFileReferenceCount: 0,
    ownDeclarationReferenceCount: 0,
    sameFileNameOccurrenceCount: 0,
    incomingReferenceCount: 0,
    identifierOccurrenceCount: 0,
    declarationNameOccurrenceCount: 0,
    declarationOnlyNameOccurrence: false,
    publicApiReferenceCount: 0,
    importerFileCount: 0,
    incomingImports: [],
    publicApi: {
      exported: false,
      exportedNames: [],
      exportKinds: [],
    },
  };
}

function declarationImportMetricKey(modulePath, declarationName) {
  const rel = utils_normalizeString(modulePath).trim();
  const name = utils_normalizeString(declarationName).trim();
  return rel && name ? `${rel}\u0000${name}` : '';
}

function namedExportDeclarationTargetMap(record) {
  const source = utils_normalizeString(record?.source);
  const masked = maskIgnorableSyntax(source);
  const exports = new Map();
  const add = (exportedName, localName, span) => {
    const exported = normalizeIdentifier(exportedName);
    const local = normalizeIdentifier(localName);
    if (exported && local && span && !exports.has(exported)) {
      exports.set(exported, { declarationName: local, span });
    }
  };
  const addVisible = (exportedName, localName, location) => {
    const span = visibleDeclarationSpanForName(record, localName, location)
      || declarationSpansNamed(record, localName)[0];
    add(exportedName, localName, span);
  };

  const directFunctionExportPattern = /\bexport\s+(?:async\s+)?function\s*\*?\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
  const directArrowExportPattern = /\bexport\s+(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
  let match;
  while ((match = directFunctionExportPattern.exec(masked))) {
    const nameStartIndex = match.index + match[0].lastIndexOf(match[1]);
    add(match[1], match[1], declarationSpanAtNameStart(record, match[1], nameStartIndex));
  }
  while ((match = directArrowExportPattern.exec(masked))) {
    const nameStartIndex = match.index + match[0].lastIndexOf(match[1]);
    add(match[1], match[1], declarationSpanAtNameStart(record, match[1], nameStartIndex));
  }
  for (const entry of namedExportListEntries(masked)) {
    for (const part of identifierListParts(entry.specifiersText)) {
      const specifier = parseNamedExportSpecifier(part);
      if (specifier) {
        addVisible(specifier.exported, specifier.local, {
          index: entry.startIndex,
          endIndex: entry.endIndex,
        });
      }
    }
  }
  return exports;
}

function namedExportDeclarationMap(record) {
  return new Map(Array.from(namedExportDeclarationTargetMap(record), ([exportedName, target]) => [
    exportedName,
    target.declarationName,
  ]));
}

function namedExportDeclarationTarget(record, exportedName) {
  const imported = normalizeIdentifier(exportedName);
  if (!imported) return null;
  const exportedDeclarations = namedExportDeclarationTargetMap(record);
  return exportedDeclarations.get(imported) || null;
}

function namedExportDeclarationName(record, exportedName) {
  const imported = normalizeIdentifier(exportedName);
  if (!imported) return '';
  const exportedDeclarations = namedExportDeclarationMap(record);
  if (exportedDeclarations.has(imported)) return exportedDeclarations.get(imported);
  return '';
}

function importBindingDeclarationName(targetRecord, binding) {
  const kind = normalizeString(binding?.kind || 'named').trim() || 'named';
  if (kind === 'named') {
    const imported = normalizeIdentifier(binding?.imported);
    return namedExportDeclarationName(targetRecord, imported);
  }
  if (kind === 'default') return defaultExportDeclarationName(targetRecord);
  return '';
}

function importBindingDeclarationTarget(targetRecord, binding) {
  const kind = utils_normalizeString(binding?.kind || 'named').trim() || 'named';
  if (kind === 'named') {
    const imported = normalizeIdentifier(binding?.imported);
    return namedExportDeclarationTarget(targetRecord, imported);
  }
  if (kind === 'default') return defaultExportDeclarationTarget(targetRecord);
  return null;
}

function declarationImportMetricsFor(metrics, record, declarationName) {
  const key = declarationImportMetricKey(record?.rel, declarationName);
  return key && metrics instanceof Map
    ? (metrics.get(key) || emptyDeclarationImportMetrics())
    : emptyDeclarationImportMetrics();
}

function declarationRelationshipsFor(relationships, record, declarationName) {
  const key = declarationImportMetricKey(record?.rel, declarationName);
  return key && relationships instanceof Map
    ? (relationships.get(key) || emptyDeclarationRelationships())
    : emptyDeclarationRelationships();
}

function previousNonWhitespaceIndex(text, start) {
  for (let index = start - 1; index >= 0; index -= 1) {
    if (!/\s/.test(text[index])) return index;
  }
  return -1;
}

function isJsxOpeningIdentifierReference(source, location) {
  const text = utils_normalizeString(source);
  const previousIndex = previousNonWhitespaceIndex(text, location?.index);
  if (text[previousIndex] !== '<') return false;
  if (/\s/.test(text[location.endIndex] || '')) return true;
  const nextIndex = findNextNonWhitespaceIndex(text, location.endIndex);
  return ['/', '>'].includes(text[nextIndex]) || /\s/.test(text[nextIndex] || '');
}

function isDirectCallableIdentifierReference(source, location) {
  const text = utils_normalizeString(source);
  const nextIndex = findNextNonWhitespaceIndex(text, location?.endIndex);
  return text[nextIndex] === '(' || isJsxOpeningIdentifierReference(text, location);
}

function isOptionalCallIdentifierReference(source, location) {
  const text = utils_normalizeString(source);
  const questionIndex = findNextNonWhitespaceIndex(text, location?.endIndex);
  if (text[questionIndex] !== '?' || text[questionIndex + 1] !== '.') return false;
  return text[findNextNonWhitespaceIndex(text, questionIndex + 2)] === '(';
}

function isTaggedTemplateIdentifierReference(source, location) {
  const text = utils_normalizeString(source);
  return text[findNextNonWhitespaceIndex(text, location?.endIndex)] === '`';
}

function isJsxOpeningMemberReference(source, location) {
  const text = utils_normalizeString(source);
  let dotIndex = previousNonWhitespaceIndex(text, location?.index);
  if (text[dotIndex] !== '.') return false;

  while (dotIndex !== -1) {
    let index = previousNonWhitespaceIndex(text, dotIndex);
    if (!/[A-Za-z0-9_$]/.test(text[index] || '')) return false;
    while (index > 0 && /[A-Za-z0-9_$]/.test(text[index - 1])) index -= 1;
    const previousIndex = previousNonWhitespaceIndex(text, index);
    if (text[previousIndex] === '<') return true;
    if (text[previousIndex] !== '.') return false;
    dotIndex = previousIndex;
  }
  return false;
}

function usageSyntaxForLocation(source, location) {
  const text = utils_normalizeString(source);
  if (isJsxOpeningIdentifierReference(text, location) || isJsxOpeningMemberReference(text, location)) {
    return 'jsx-element';
  }
  if (isOptionalCallIdentifierReference(text, location)) return 'optional-call';
  if (isTaggedTemplateIdentifierReference(text, location)) return 'tagged-template';
  const nextIndex = findNextNonWhitespaceIndex(text, location?.endIndex);
  return text[nextIndex] === '(' ? 'call' : 'reference';
}

function compactReferenceUsages(record, referenceLocations) {
  const seen = new Set();
  return (Array.isArray(referenceLocations) ? referenceLocations : [])
    .map((location) => ({
      line: Number.isInteger(location?.line)
        ? location.line
        : lineNumberAtSourceIndex(record?.source, location?.index),
      syntax: usageSyntaxForLocation(record?.source, location),
    }))
    .filter((usage) => Number.isInteger(usage.line) && usage.line > 0 && usage.syntax)
    .filter((usage) => {
      const key = `${usage.line}\u0000${usage.syntax}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.line - b.line || compareLocale(a.syntax, b.syntax));
}

function usageLinesForUsages(usages) {
  return Array.from(new Set((Array.isArray(usages) ? usages : [])
    .map((usage) => usage.line)
    .filter((line) => Number.isInteger(line) && line > 0)))
    .sort((a, b) => a - b);
}

function syntaxKindsForUsages(usages) {
  return Array.from(new Set((Array.isArray(usages) ? usages : [])
    .map((usage) => utils_normalizeString(usage.syntax).trim())
    .filter(Boolean)))
    .sort(compareLocale);
}

function relationKindForSyntaxKinds(syntaxKinds) {
  const kinds = Array.isArray(syntaxKinds) ? syntaxKinds : [];
  if (kinds.length !== 1) return 'mixed-static-usage';
  if (kinds[0] === 'jsx-element') return 'static-jsx-element';
  if (kinds[0] === 'reference') return 'static-reference';
  return 'static-call';
}

function namespaceReferenceMaskedSource(source) {
  return maskIgnorableSyntax(source)
    .replace(/<\/\s*[A-Za-z_$][A-Za-z0-9_$]*(?:\s*\.\s*[A-Za-z_$][A-Za-z0-9_$]*)*/g, (closingTag) => (
      ' '.repeat(closingTag.length)
    ));
}

function isNamespaceBaseReference(masked, location) {
  const previousIndex = previousNonWhitespaceIndex(masked, location.index);
  if (previousIndex === -1) return true;
  return masked[previousIndex] !== '.' && masked[previousIndex] !== '#';
}

function namespaceMemberAfter(masked, endIndex) {
  let operatorIndex = findNextNonWhitespaceIndex(masked, endIndex);
  if (masked[operatorIndex] === '?') {
    if (masked[operatorIndex + 1] !== '.') return null;
    operatorIndex += 2;
  } else if (masked[operatorIndex] === '.') {
    operatorIndex += 1;
  } else {
    return null;
  }
  const memberStart = findNextNonWhitespaceIndex(masked, operatorIndex);
  const match = masked.slice(memberStart).match(/^([A-Za-z_$][A-Za-z0-9_$]*)/);
  if (!match) return null;
  return {
    name: match[1],
    index: memberStart,
    endIndex: memberStart + match[1].length,
  };
}

function declarationReferenceLocations(record, span, identifier, {
  directCallableOnly = false,
  binding,
  ref,
  ignoredBindingLocations = [],
} = {}) {
  const locations = cachedIdentifierReferenceLocations(record, identifier)
    .filter((location) => !isAnyDeclarationNameLocation(record, location))
    .filter((location) => !locationInTypeOnlyRange(record, location))
    .filter((location) => locationOwnedByDeclaration(record, span, location))
    .filter((location) => !isShadowedReferenceLocation(record, span, identifier, location, {
      binding,
      ref,
      ignoredBindingLocations,
    }));
  return directCallableOnly
    ? locations.filter((location) => isDirectCallableIdentifierReference(record?.source, location))
    : locations;
}

function namespaceMemberReferenceLocations(record, span, namespaceName, { binding, ref } = {}) {
  const namespace = normalizeIdentifier(namespaceName);
  if (!namespace) return new Map();
  const masked = namespaceReferenceMaskedSource(record?.source);
  const escaped = escapeRegExp(namespace);
  const pattern = new RegExp(`(?<![A-Za-z0-9_$])${escaped}(?![A-Za-z0-9_$])`, 'g');
  const locationsByMember = new Map();
  let match;
  while ((match = pattern.exec(masked))) {
    const namespaceLocation = {
      index: match.index,
      endIndex: match.index + namespace.length,
    };
    if (!isNamespaceBaseReference(masked, namespaceLocation)) continue;
    const member = namespaceMemberAfter(masked, namespaceLocation.endIndex);
    const memberName = normalizeIdentifier(member?.name);
    if (!memberName) continue;
    const memberLocation = {
      index: member.index,
      endIndex: member.endIndex,
    };
    if (span && !locationOwnedByDeclaration(record, span, namespaceLocation)) continue;
    if (span && isShadowedReferenceLocation(record, span, namespace, namespaceLocation, { binding, ref })) continue;
    if (!locationsByMember.has(memberName)) locationsByMember.set(memberName, []);
    locationsByMember.get(memberName).push(memberLocation);
  }
  return locationsByMember;
}

function importBindingRelationshipTarget(targetRecord, binding) {
  if (importBindingIsTypeOnly(binding)) return null;
  const bindingKind = utils_normalizeString(binding?.kind || 'named').trim() || 'named';
  if (bindingKind === 'namespace') return null;

  const target = importBindingDeclarationTarget(targetRecord, binding);
  return target?.span ? {
    declarationName: target.declarationName,
    span: target.span,
    importedName: bindingKind === 'default' ? 'default' : binding.imported,
    directCallableOnly: false,
  } : null;
}

function reExportNamedBindings(record, importedName) {
  const name = normalizeIdentifier(importedName);
  if (!name) return [];
  return (Array.isArray(record?.importRefs) ? record.importRefs : [])
    .filter((ref) => ref.kind === 'export' && ref.localRel && !importRefIsTypeOnly(ref))
    .flatMap((ref) => (Array.isArray(ref.bindings) ? ref.bindings : [])
      .filter((binding) => !importBindingIsTypeOnly(binding))
      .filter((binding) => normalizeIdentifier(binding.local) === name || normalizeIdentifier(binding.imported) === name)
      .map((binding) => ({
        ref,
        importedName: normalizeIdentifier(binding.imported) || name,
      })));
}

function importBindingRelationshipTargets(graph, targetRecord, binding, seen = new Set()) {
  const direct = importBindingRelationshipTarget(targetRecord, binding);
  if (direct) return [{ targetRecord, target: direct }];

  const bindingKind = utils_normalizeString(binding?.kind || 'named').trim() || 'named';
  const importedName = bindingKind === 'default' ? 'default' : normalizeIdentifier(binding?.imported);
  if (!graph || bindingKind !== 'named' || !targetRecord?.rel || !importedName) return [];
  const seenKey = `${targetRecord.rel}\u0000${importedName}`;
  if (seen.has(seenKey)) return [];
  seen.add(seenKey);

  const targets = [];
  for (const reExport of reExportNamedBindings(targetRecord, importedName)) {
    const reExportTarget = graph.modules.get(reExport.ref.localRel);
    if (!reExportTarget) continue;
    targets.push(...importBindingRelationshipTargets(
      graph,
      reExportTarget,
      {
        ...binding,
        imported: reExport.importedName,
        kind: 'named',
        typeOnly: false,
      },
      seen,
    ));
  }
  return targets;
}

function namespaceImportRelationshipTarget(targetRecord, binding, memberName) {
  if (importBindingIsTypeOnly(binding)) return null;
  const importedName = normalizeIdentifier(memberName);
  const target = namedExportDeclarationTarget(targetRecord, importedName);
  const namespaceName = normalizeIdentifier(binding?.local);
  return target?.span ? {
    declarationName: target.declarationName,
    span: target.span,
    importedName,
    localName: namespaceName ? `${namespaceName}.${importedName}` : importedName,
    directCallableOnly: false,
  } : null;
}

function bindingReferenceGroups({
  graph,
  importerRecord,
  importerSpan,
  targetRecord,
  binding,
  ref,
}) {
  if (importRefIsTypeOnly(ref) || importBindingIsTypeOnly(binding)) return [];
  const bindingKind = utils_normalizeString(binding?.kind || 'named').trim() || 'named';
  if (bindingKind === 'namespace') {
    return Array.from(namespaceMemberReferenceLocations(
      importerRecord,
      importerSpan,
      binding.local,
      { binding, ref },
    ), ([memberName, referenceLocations]) => ({
      targetRecord,
      target: namespaceImportRelationshipTarget(targetRecord, binding, memberName),
      referenceLocations,
    })).filter((group) => group.target && group.referenceLocations.length > 0);
  }

  const targets = importBindingRelationshipTargets(graph, targetRecord, binding);
  if (targets.length === 0) return [];
  const referenceLocations = declarationReferenceLocations(
    importerRecord,
    importerSpan,
    binding.local,
    {
      directCallableOnly: targets.some((target) => Boolean(target.target?.directCallableOnly)),
      binding,
      ref,
    },
  );
  return referenceLocations.length > 0
    ? targets.map((target) => ({ ...target, referenceLocations }))
    : [];
}

function compactUseRelationship({
  importerRecord,
  targetRecord,
  target,
  binding,
  ref,
  referenceLocations,
}) {
  const localName = utils_normalizeString(target.localName || binding?.local).trim();
  const usages = compactReferenceUsages(importerRecord, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  return {
    name: localName || target.declarationName,
    declarationName: target.declarationName,
    importedName: utils_normalizeString(target.importedName).trim(),
    localName,
    bindingKind: utils_normalizeString(binding?.kind || 'named').trim() || 'named',
    loadKind: utils_normalizeString(ref?.kind).trim() || 'import',
    specifier: utils_normalizeString(ref?.specifier).trim(),
    modulePath: targetRecord.rel,
    startLine: target.span.startLine,
    endLine: target.span.endLine,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
  };
}

function compactImportedByRelationship({
  importerRecord,
  importerName,
  importerSpan,
  target,
  binding,
  ref,
  referenceLocations,
}) {
  const localName = utils_normalizeString(target?.localName || binding?.local).trim();
  const usages = compactReferenceUsages(importerRecord, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  return {
    name: importerName,
    declarationName: importerName,
    localName,
    importedName: utils_normalizeString(target?.importedName || binding?.imported).trim(),
    bindingKind: utils_normalizeString(binding?.kind || 'named').trim() || 'named',
    loadKind: utils_normalizeString(ref?.kind).trim() || 'import',
    specifier: utils_normalizeString(ref?.specifier).trim(),
    modulePath: importerRecord.rel,
    startLine: importerSpan.startLine,
    endLine: importerSpan.endLine,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
  };
}

function compareDeclarationRelationship(a, b) {
  return compareLocale(a.modulePath, b.modulePath)
    || a.startLine - b.startLine
    || a.endLine - b.endLine
    || compareLocale(a.name, b.name)
    || compareLocale(a.localName, b.localName)
    || compareLocale(a.importedName, b.importedName);
}

function addDeclarationRelationship(bucket, listName, seen, seenKey, relationship) {
  if (seen.has(seenKey)) return;
  seen.add(seenKey);
  bucket[listName].push(relationship);
}

function buildDeclarationRelationships(graph) {
  const relationships = new Map();
  const seenUses = new Set();
  const seenImportedBy = new Set();
  const ensure = (record, declarationName) => {
    const key = declarationImportMetricKey(record?.rel, declarationName);
    if (!key) return null;
    if (!relationships.has(key)) relationships.set(key, emptyDeclarationRelationships());
    return relationships.get(key);
  };

  for (const importerRecord of graph.modules.values()) {
    const importerSpans = Array.from(declarationSpansByName(importerRecord));
    if (importerSpans.length === 0) continue;
    for (const ref of Array.isArray(importerRecord.importRefs) ? importerRecord.importRefs : []) {
      const targetRecord = ref?.localRel ? graph.modules.get(ref.localRel) : null;
      if (!targetRecord) continue;
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.local) continue;

        for (const [importerName, importerSpan] of importerSpans) {
          for (const { targetRecord: resolvedTargetRecord, target, referenceLocations } of bindingReferenceGroups({
            graph,
            importerRecord,
            importerSpan,
            targetRecord,
            binding,
            ref,
          })) {
            const relationshipTargetRecord = resolvedTargetRecord || targetRecord;
            const targetKey = declarationImportMetricKey(relationshipTargetRecord.rel, target.declarationName);
            if (!targetKey) continue;

            const importerKey = declarationImportMetricKey(importerRecord.rel, importerName);
            const useBucket = ensure(importerRecord, importerName);
            const importedByBucket = ensure(relationshipTargetRecord, target.declarationName);
            if (!importerKey || !useBucket || !importedByBucket) continue;

            const relationshipKey = [
              importerKey,
              targetKey,
              target.localName || binding.local,
              target.importedName || binding.imported,
              binding.kind,
              ref.kind,
              ref.specifier,
            ].join('\u0000');
            const referenceCount = referenceLocations.length;
            addDeclarationRelationship(
              useBucket,
              'importedFunctionUses',
              seenUses,
              relationshipKey,
              compactUseRelationship({
                importerRecord,
                targetRecord: relationshipTargetRecord,
                target,
                binding,
                ref,
                referenceLocations,
              }),
            );
            addDeclarationRelationship(
              importedByBucket,
              'importedBy',
              seenImportedBy,
              relationshipKey,
              compactImportedByRelationship({
                importerRecord,
                importerName,
                importerSpan,
                target,
                binding,
                ref,
                referenceLocations,
              }),
            );
          }
        }
      }
    }
  }

  for (const bucket of relationships.values()) {
    bucket.importedFunctionUses.sort(compareDeclarationRelationship);
    bucket.importedBy.sort(compareDeclarationRelationship);
  }
  return relationships;
}

function buildDeclarationImportMetrics(graph) {
  const buckets = new Map();
  for (const record of graph.modules.values()) {
    for (const [declarationName, span] of declarationSpansByName(record)) {
      const key = declarationImportMetricKey(record.rel, declarationName);
      if (!key) continue;
      const publicApi = declarationPublicApiInfo(record, declarationName);
      const identifierMetrics = declarationIdentifierMetrics(record, span, publicApi);
      buckets.set(key, {
        ...identifierMetrics,
        incomingReferenceCount: 0,
        importerFiles: new Set(),
        incomingImports: [],
        publicApi: {
          exported: publicApi.exported,
          exportedNames: publicApi.exportedNames,
          exportKinds: publicApi.exportKinds,
        },
      });
    }
  }
  for (const importerRecord of graph.modules.values()) {
    for (const ref of Array.isArray(importerRecord.importRefs) ? importerRecord.importRefs : []) {
      const targetRecord = ref?.localRel ? graph.modules.get(ref.localRel) : null;
      if (!targetRecord) continue;
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.local) continue;
        const importGroups = new Map();
        for (const [, importerSpan] of declarationSpansByName(importerRecord)) {
          for (const { targetRecord: resolvedTargetRecord, target, referenceLocations } of bindingReferenceGroups({
            graph,
            importerRecord,
            importerSpan,
            targetRecord,
            binding,
            ref,
          })) {
            const relationshipTargetRecord = resolvedTargetRecord || targetRecord;
            const groupKey = declarationImportMetricKey(relationshipTargetRecord.rel, target.declarationName);
            if (!groupKey) continue;
            if (!importGroups.has(groupKey)) {
              importGroups.set(groupKey, { target, targetRecord: relationshipTargetRecord, referenceCount: 0 });
            }
            importGroups.get(groupKey).referenceCount += referenceLocations.length;
          }
        }
        for (const [key, { target, targetRecord: relationshipTargetRecord, referenceCount }] of importGroups) {
          if (!buckets.has(key)) {
            buckets.set(key, {
              identifierOccurrenceCount: 0,
              declarationNameOccurrenceCount: 0,
              declarationOnlyNameOccurrence: false,
              sameFileReferenceCount: 0,
              ownDeclarationReferenceCount: 0,
              publicApiReferenceCount: 0,
              incomingReferenceCount: 0,
              importerFiles: new Set(),
              incomingImports: [],
              publicApi: {
                exported: false,
                exportedNames: [],
                exportKinds: [],
              },
            });
          }
          const bucket = buckets.get(key);
          bucket.incomingReferenceCount += referenceCount;
          if (importerRecord.rel !== relationshipTargetRecord.rel) {
            bucket.importerFiles.add(importerRecord.rel);
            bucket.incomingImports.push({
              importerPath: importerRecord.rel,
              specifier: ref.specifier,
              loadKind: utils_normalizeString(ref.kind).trim() || 'import',
              imported: target.importedName || binding.imported,
              local: target.localName || binding.local,
              bindingKind: binding.kind,
              inferred: Boolean(binding.inferred),
              referenceCount,
            });
          }
        }
      }
    }
  }

  return new Map(Array.from(buckets, ([key, bucket]) => [key, {
    referenceCount: bucket.sameFileReferenceCount + bucket.incomingReferenceCount,
    directIdentifierReferenceCount: bucket.sameFileReferenceCount + bucket.incomingReferenceCount,
    sameFileReferenceCount: bucket.sameFileReferenceCount,
    ownDeclarationReferenceCount: bucket.ownDeclarationReferenceCount,
    sameFileNameOccurrenceCount: Math.max(
      0,
      bucket.identifierOccurrenceCount - bucket.declarationNameOccurrenceCount - bucket.ownDeclarationReferenceCount,
    ),
    incomingReferenceCount: bucket.incomingReferenceCount,
    identifierOccurrenceCount: bucket.identifierOccurrenceCount,
    declarationNameOccurrenceCount: bucket.declarationNameOccurrenceCount,
    declarationOnlyNameOccurrence: bucket.declarationOnlyNameOccurrence,
    publicApiReferenceCount: bucket.publicApiReferenceCount,
    importerFileCount: bucket.importerFiles.size,
    incomingImports: bucket.incomingImports.sort((a, b) => compareLocale(a.importerPath, b.importerPath)
      || compareLocale(a.loadKind, b.loadKind)
      || compareLocale(a.imported, b.imported)
      || compareLocale(a.local, b.local)),
    publicApi: bucket.publicApi,
  }]));
}

function memberMetricLabel(label, lineCount, metrics = emptyDeclarationImportMetrics()) {
  if (!Number.isInteger(lineCount) || lineCount <= 0) return label;
  const referenceCount = Number.isInteger(metrics.referenceCount) && metrics.referenceCount >= 0
    ? metrics.referenceCount
    : 0;
  const importerFileCount = Number.isInteger(metrics.importerFileCount) && metrics.importerFileCount >= 0
    ? metrics.importerFileCount
    : 0;
  return `${label} [lines: ${lineCount} | refs: ${referenceCount} | importers: ${importerFileCount}]`;
}

function mermaidClassLabel(record) {
  return `${record.stats.lineCount} ${external_node_path_namespaceObject.posix.basename(record.rel)}`;
}

function escapeMermaidLabel(label) {
  return utils_normalizeString(label).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function mermaidClassHeader(record, classId) {
  return `class ${classId}["${escapeMermaidLabel(mermaidClassLabel(record))}"]`;
}

function importSpecifierLooksLocal(specifier, aliases, routeAliases) {
  const raw = utils_normalizeString(specifier).trim();
  if (!raw) return false;
  if (raw.startsWith('.') || raw.startsWith('/')) return true;
  for (const key of aliases.keys()) {
    if (raw === key || (key.endsWith('/') && raw.startsWith(key))) return true;
  }
  return routeAliases.some((alias) => raw === alias.from.slice(0, -1) || raw.startsWith(alias.from));
}

function importBindingIsTypeOnly(binding = {}) {
  return Boolean(binding?.typeOnly);
}

function importRefIsTypeOnly(ref = {}) {
  const bindings = Array.isArray(ref.bindings) ? ref.bindings : [];
  return Boolean(ref.typeOnly) || (bindings.length > 0 && bindings.every(importBindingIsTypeOnly));
}

function externalLabel(specifier) {
  const raw = utils_normalizeString(specifier).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).hostname;
    } catch {
      return raw;
    }
  }
  return raw;
}

function isIgnoredExternalLabel(label) {
  return utils_normalizeString(label).trim().toLowerCase() === 'react';
}

function isJsxModule(rel) {
  return /\.jsx$/i.test(rel);
}

function moduleRecords(graph, { reachableOnly = false } = {}) {
  return Array.from(graph.modules.values())
    .filter((record) => !reachableOnly || record.reachable)
    .sort((a, b) => compareLocale(a.rel, b.rel));
}

function jsxModuleRecords(graph, options = {}) {
  return moduleRecords(graph, options)
    .filter((record) => isJsxModule(record.rel))
    .sort((a, b) => compareLocale(a.rel, b.rel));
}

function buildClassIds(records) {
  const baseCounts = new Map();
  const ids = new Map();
  for (const record of records) {
    const base = utils_normalizeString(external_node_path_namespaceObject.posix.basename(record.rel, external_node_path_namespaceObject.posix.extname(record.rel)))
      .replace(/[^A-Za-z0-9_$]/g, '_') || 'Module';
    const count = (baseCounts.get(base) || 0) + 1;
    baseCounts.set(base, count);
    ids.set(record.rel, count === 1 ? base : `${base}_${count}`);
  }
  return ids;
}

function importedScriptVariableName(ref) {
  const bindings = Array.isArray(ref?.bindings) ? ref.bindings : [];
  const binding = bindings.find((candidate) => candidate.kind === 'named')
    || bindings.find((candidate) => candidate.kind === 'namespace')
    || bindings.find((candidate) => candidate.kind === 'default');
  return utils_normalizeString(binding?.local).trim();
}

function namespaceMemberNamesForRecord(record, binding, ref) {
  const names = new Set();
  for (const [, span] of declarationSpansByName(record)) {
    for (const memberName of namespaceMemberReferenceLocations(record, span, binding.local, { binding, ref }).keys()) {
      names.add(memberName);
    }
  }
  return Array.from(names).sort(compareLocale);
}

function importedScriptCandidatesForJsx(record, graph, declarationImportMetrics) {
  const candidates = [];
  for (const ref of Array.isArray(record.importRefs) ? record.importRefs : []) {
    if (ref?.localRel && isJsxModule(ref.localRel)) continue;
    if (isIgnoredExternalLabel(ref?.specifier)) continue;
    const name = importedScriptVariableName(ref);
    if (name === 'React') continue;
    if (!name) continue;
    const targetRecord = ref.localRel ? graph.modules.get(ref.localRel) : null;
    const binding = (Array.isArray(ref.bindings) ? ref.bindings : [])
      .find((candidate) => candidate.local === name);
    if (targetRecord && binding?.kind === 'namespace') {
      for (const memberName of namespaceMemberNamesForRecord(record, binding, ref)) {
        const target = namedExportDeclarationTarget(targetRecord, memberName);
        const declarationName = target?.declarationName || '';
        const visibleName = `${name}.${memberName}`;
        candidates.push({
          name: visibleName,
          targetRecord,
          binding,
          declarationName,
          span: target?.span || null,
          lineCount: target?.span?.lineCount || declarationLineCount(targetRecord, declarationName),
          metrics: declarationImportMetricsFor(declarationImportMetrics, targetRecord, declarationName),
        });
      }
      continue;
    }
    const target = importBindingDeclarationTarget(targetRecord, binding);
    const resolvedDeclarationName = target?.declarationName || '';
    const declarationName = resolvedDeclarationName || (targetRecord ? '' : name);
    candidates.push({
      name,
      targetRecord,
      binding,
      declarationName,
      span: target?.span || null,
      lineCount: target?.span?.lineCount || declarationLineCount(targetRecord, declarationName),
      metrics: declarationImportMetricsFor(declarationImportMetrics, targetRecord, declarationName),
    });
  }
  return candidates.sort((a, b) => compareLocale(a.name, b.name));
}

function importedScriptMembersForJsx(record, graph, declarationImportMetrics) {
  const members = new Map();
  for (const candidate of importedScriptCandidatesForJsx(record, graph, declarationImportMetrics)) {
    const { name, lineCount, metrics } = candidate;
    const existing = members.get(name);
    if (!existing || (!existing.lineCount && lineCount)) {
      members.set(name, { name, lineCount, metrics });
    }
  }
  return Array.from(members.values()).sort((a, b) => compareLocale(a.name, b.name));
}

function functionNodeForDeclaration(functionNodesByDeclarationKey, record, span, declarationName) {
  const key = [
    utils_normalizeString(record?.rel).trim(),
    utils_normalizeString(declarationName || span?.name).trim(),
    utils_normalizeString(span?.kind).trim(),
    span?.startLine,
    span?.endLine,
  ].join('\u0000');
  return functionNodesByDeclarationKey.get(key) || null;
}

function functionNodesByDeclarationKey(functionDependencyMap = {}) {
  const nodes = new Map();
  for (const node of Array.isArray(functionDependencyMap.functions) ? functionDependencyMap.functions : []) {
    const key = [
      utils_normalizeString(node.modulePath).trim(),
      utils_normalizeString(node.declarationName || node.name).trim(),
      utils_normalizeString(node.kind).trim(),
      node.startLine,
      node.endLine,
    ].join('\u0000');
    if (key && !nodes.has(key)) nodes.set(key, node);
  }
  return nodes;
}

function importedScriptSourceDeclarationsForJsx(
  record,
  graph,
  moduleId,
  declarationImportMetrics,
  declarationRelationships,
  functionNodes,
) {
  const declarations = new Map();
  for (const candidate of importedScriptCandidatesForJsx(record, graph, declarationImportMetrics)) {
    const { name, targetRecord, binding, declarationName, metrics } = candidate;
    if (!targetRecord) continue;

    const span = candidate.span || declarationSpansByName(targetRecord).get(declarationName);
    const entry = sourceDeclarationEntry({
      moduleId,
      visibleName: name,
      record: targetRecord,
      span,
      declarationName,
      sourceOrigin: 'imported-script-member',
      metrics,
      relationships: declarationRelationshipsFor(declarationRelationships, targetRecord, declarationName),
      functionNode: functionNodeForDeclaration(functionNodes, targetRecord, span, declarationName),
    });
    if (entry && !declarations.has(entry.name)) declarations.set(entry.name, entry);
  }
  return Array.from(declarations.values())
    .sort((a, b) => compareLocale(a.name, b.name));
}

function importKindRank(kind) {
  if (kind === 'default') return 0;
  if (kind === 'namespace') return 1;
  return 2;
}

function compareImportEdgeBinding(a, b) {
  return importKindRank(a.kind) - importKindRank(b.kind)
    || compareLocale(a.imported, b.imported)
    || compareLocale(a.local, b.local)
    || Number(a.inferred) - Number(b.inferred);
}

function importBindingLineCount(graph, targetRel, binding) {
  if (binding.kind !== 'named') return null;
  const targetRecord = graph.modules.get(targetRel);
  const target = importBindingDeclarationTarget(targetRecord, binding);
  return target?.span?.lineCount || declarationLineCount(targetRecord, target?.declarationName);
}

function edgeRestingLabel(loadKinds) {
  const kinds = Array.isArray(loadKinds) ? loadKinds : Array.from(loadKinds || []);
  const isLazyOnly = kinds.length > 0
    && kinds.every((kind) => kind === 'lazy' || kind === 'dynamic');
  return isLazyOnly ? 'lazy' : 'import';
}

function buildImportEdges(graph, { reachableOnly = false } = {}) {
  const jsxModules = jsxModuleRecords(graph, { reachableOnly });
  const classIds = buildClassIds(jsxModules);
  const edgeMap = new Map();

  for (const record of jsxModules) {
    const source = classIds.get(record.rel);
    for (const ref of Array.isArray(record.importRefs) ? record.importRefs : []) {
      if (importRefIsTypeOnly(ref)) continue;
      if (!ref?.localRel || !classIds.has(ref.localRel)) continue;
      const key = `${record.rel}\u0000${ref.localRel}`;
      if (!edgeMap.has(key)) {
        const targetRecord = graph.modules.get(ref.localRel);
        edgeMap.set(key, {
          source,
          target: classIds.get(ref.localRel),
          sourcePath: record.rel,
          targetPath: ref.localRel,
          targetLineCount: targetRecord?.stats?.lineCount || null,
          loadKinds: new Set(),
          imports: new Map(),
        });
      }

      const edge = edgeMap.get(key);
      const loadKind = utils_normalizeString(ref.kind).trim();
      if (loadKind) edge.loadKinds.add(loadKind);
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.imported || !binding?.local) continue;
        const lineCount = importBindingLineCount(graph, ref.localRel, binding);
        const enriched = lineCount ? { ...binding, lineCount } : binding;
        const bindingKey = `${binding.kind}\u0000${binding.imported}\u0000${binding.local}\u0000${binding.inferred}`;
        edge.imports.set(bindingKey, enriched);
      }
    }
  }

  return Array.from(edgeMap.values())
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourcePath: edge.sourcePath,
      targetPath: edge.targetPath,
      targetLineCount: edge.targetLineCount,
      loadKinds: Array.from(edge.loadKinds).sort(compareLocale),
      imports: Array.from(edge.imports.values()).sort(compareImportEdgeBinding),
    }))
    .sort((a, b) => compareLocale(a.sourcePath, b.sourcePath)
      || compareLocale(a.targetPath, b.targetPath)
      || compareLocale(a.source, b.source)
      || compareLocale(a.target, b.target));
}

function encodedStaticId(value) {
  return Buffer.from(utils_normalizeString(value), 'utf8').toString('base64url');
}

function compactStableId(prefix, parts) {
  const digest = (0,external_node_crypto_namespaceObject.createHash)('sha256')
    .update(parts.map((part) => utils_normalizeString(part)).join('\u0000'))
    .digest('hex')
    .slice(0, 16);
  return `${prefix}_${digest}`;
}

function functionStableIdForNode(node = {}) {
  return compactStableId('fn', [
    node.modulePath,
    node.scopePath,
    node.name,
    node.kind,
  ]);
}

function withCollisionSafeStableIds(items, stableIdForItem) {
  const counts = new Map();
  return items.map((item) => {
    const baseId = stableIdForItem(item);
    const ordinal = (counts.get(baseId) || 0) + 1;
    counts.set(baseId, ordinal);
    return { ...item, stableId: ordinal === 1 ? baseId : `${baseId}_${ordinal}` };
  });
}

function legacyFunctionSpanKey(record, span) {
  return [
    utils_normalizeString(record?.rel).trim(),
    utils_normalizeString(span?.name).trim(),
    utils_normalizeString(span?.kind).trim(),
    span?.startLine,
    span?.endLine,
  ].join('\u0000');
}

function functionSpanKey(record, span) {
  return [
    legacyFunctionSpanKey(record, span),
    span?.startIndex,
    span?.endIndex,
    span?.nameStartIndex,
  ].join('\u0000');
}

function functionIdentityKeysForSpans(record, spans) {
  const groups = new Map();
  for (const span of spans) {
    const legacyKey = legacyFunctionSpanKey(record, span);
    if (!groups.has(legacyKey)) groups.set(legacyKey, []);
    groups.get(legacyKey).push(span);
  }

  const identities = new Map();
  for (const [legacyKey, group] of groups) {
    const ordered = [...group].sort((a, b) => a.startIndex - b.startIndex
      || a.nameStartIndex - b.nameStartIndex
      || a.endIndex - b.endIndex);
    if (ordered.length === 1) {
      identities.set(ordered[0], legacyKey);
      continue;
    }
    ordered.forEach((span, index) => {
      identities.set(span, `${legacyKey}\u0000${index + 1}`);
    });
  }
  return identities;
}

function functionIdForSpan(record, span, identityKey = legacyFunctionSpanKey(record, span)) {
  return encodedStaticId(`function\u0000${identityKey}`);
}

function normalizedImplementationSourceForSpan(record, span) {
  const source = utils_normalizeString(record?.source);
  const endIndex = declarationSpanExclusiveEnd(span);
  if (!Number.isInteger(span?.startIndex) || !Number.isInteger(endIndex) || endIndex <= span.startIndex) {
    return '';
  }
  const declarationSource = source.slice(span.startIndex, endIndex);
  const nameStart = Number.isInteger(span.nameStartIndex) ? span.nameStartIndex - span.startIndex : -1;
  const nameEnd = Number.isInteger(span.nameEndIndex) ? span.nameEndIndex - span.startIndex : -1;
  const nameMasked = nameStart >= 0 && nameEnd > nameStart && nameEnd <= declarationSource.length
    ? `${declarationSource.slice(0, nameStart)}__IRONG_DECLARATION_NAME__${declarationSource.slice(nameEnd)}`
    : declarationSource;
  return nameMasked.replace(/\r\n?/g, '\n');
}

function implementationFingerprintForSpan(record, span) {
  const implementationSource = normalizedImplementationSourceForSpan(record, span);
  return compactStableId('impl', [implementationSource]);
}

function functionDependencyEdgeId({ sourceNode, targetNode, scope, importInfo }) {
  return encodedStaticId([
    'function-edge',
    sourceNode?.id,
    targetNode?.id,
    scope,
    importInfo?.specifier || '',
    importInfo?.loadKind || '',
    importInfo?.bindingKind || '',
    importInfo?.importedName || '',
    importInfo?.localName || '',
  ].join('\u0000'));
}

function compareFunctionNode(a, b) {
  return compareLocale(a.modulePath, b.modulePath)
    || a.startLine - b.startLine
    || a.endLine - b.endLine
    || (a.declarationColumn || 0) - (b.declarationColumn || 0)
    || compareLocale(a.name, b.name)
    || compareLocale(a.kind, b.kind)
    || compareLocale(a.id, b.id);
}

function compareFunctionEdge(a, b) {
  return compareLocale(a.sourceModulePath, b.sourceModulePath)
    || a.sourceStartLine - b.sourceStartLine
    || compareLocale(a.targetModulePath, b.targetModulePath)
    || a.targetStartLine - b.targetStartLine
    || compareLocale(a.scope, b.scope)
    || compareLocale(a.targetFunction, b.targetFunction)
    || compareLocale(a.import?.localName || '', b.import?.localName || '');
}

function functionNodeForSpan(record, span, { nested = false, scopePath = '', identityKey = null } = {}) {
  const name = utils_normalizeString(span?.name).trim();
  const declarationType = utils_normalizeString(span?.declarationType).trim()
    || (span?.kind === 'arrow' ? 'arrow-variable' : 'function-declaration');
  const detectedPublicApi = declarationPublicApiInfo(record, name);
  const publicApi = nested || declarationType === 'function-expression-name'
    ? { exported: false, exportedNames: [], exportKinds: [] }
    : detectedPublicApi;
  return {
    id: functionIdForSpan(record, span, identityKey || legacyFunctionSpanKey(record, span)),
    modulePath: record.rel,
    name,
    declarationName: name,
    kind: utils_normalizeString(span?.kind).trim() || 'function',
    component: /^[A-Z]/.test(name),
    reachable: Boolean(record.reachable),
    exported: Boolean(publicApi.exported),
    exportedNames: publicApi.exportedNames,
    exportKinds: publicApi.exportKinds,
    declarationType,
    standalone: !nested && declarationType !== 'function-expression-name',
    implementationFingerprint: implementationFingerprintForSpan(record, span),
    scopePath,
    declarationLine: lineNumberAtSourceIndex(record.source, span.nameStartIndex),
    declarationColumn: sourceColumnAtIndex(record.source, span.nameStartIndex),
    startLine: span.startLine,
    endLine: span.endLine,
    lineCount: span.lineCount,
  };
}

function normalizeScopeSegment(segment) {
  return utils_normalizeString(maskIgnorableSyntax(segment))
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+([,;:{}[\]])/g, '$1')
    .replace(/([({[\]])\s+/g, '$1')
    .trim();
}

function scopeSegmentForRange(record, range) {
  const source = maskIgnorableSyntax(utils_normalizeString(record?.source));
  const boundary = Math.max(
    source.lastIndexOf('\n', range.startIndex - 1),
    source.lastIndexOf(';', range.startIndex - 1),
    source.lastIndexOf('}', range.startIndex - 1),
  );
  const segment = normalizeScopeSegment(source.slice(boundary + 1, range.startIndex));
  if (segment) return segment;
  return 'anonymous-block';
}

function functionNodeDescriptors(graph) {
  const descriptors = [];
  const bySpanKey = new Map();
  const byModulePath = new Map();

  for (const record of moduleRecords(graph)) {
    const spans = (Array.isArray(record?.declarationSpans) ? record.declarationSpans : [])
      .filter((span) => ['function', 'arrow'].includes(span?.kind))
      .sort((a, b) => a.startLine - b.startLine
        || a.endLine - b.endLine
        || compareLocale(a.name, b.name)
        || compareLocale(a.kind, b.kind));
    const blockRanges = lexicalBlockRanges(record);
    const identityKeys = functionIdentityKeysForSpans(record, spans);
    const scopePathFor = (span) => blockRanges
      .filter((range) => range.startIndex < span.nameStartIndex && range.endIndex >= span.nameEndIndex)
      .sort((a, b) => a.startIndex - b.startIndex || b.endIndex - a.endIndex)
      .map((range) => scopeSegmentForRange(record, range))
      .join('/');
    for (const span of spans) {
      const scopePath = scopePathFor(span);
      const nested = Boolean(scopePath);
      const node = functionNodeForSpan(record, span, {
        nested,
        scopePath,
        identityKey: identityKeys.get(span),
      });
      const descriptor = { node, record, span };
      descriptors.push(descriptor);
      bySpanKey.set(functionSpanKey(record, span), descriptor);
      if (!byModulePath.has(record.rel)) byModulePath.set(record.rel, []);
      byModulePath.get(record.rel).push(descriptor);
    }
  }

  descriptors.sort((a, b) => compareFunctionNode(a.node, b.node));
  for (const list of byModulePath.values()) {
    list.sort((a, b) => compareFunctionNode(a.node, b.node));
  }
  return { descriptors, bySpanKey, byModulePath };
}

function sameModuleReferenceLocations(record, callerSpan, targetSpan) {
  return declarationReferenceLocations(record, callerSpan, targetSpan?.name, {
    ignoredBindingLocations: [{
      index: targetSpan?.nameStartIndex,
      endIndex: targetSpan?.nameEndIndex,
    }],
  }).filter((location) => visibleDeclarationSpanForName(record, targetSpan?.name, location) === targetSpan);
}

function declarationSearchText(record, span) {
  const source = utils_normalizeString(record?.source);
  const endIndex = declarationSpanExclusiveEnd(span);
  if (!Number.isInteger(span?.nameEndIndex) || !Number.isInteger(endIndex) || endIndex <= span.nameEndIndex) {
    return '';
  }
  return source.slice(span.nameEndIndex, endIndex);
}

function functionImportInfo(target, binding, ref) {
  const localName = utils_normalizeString(target?.localName || binding?.local).trim();
  return {
    specifier: utils_normalizeString(ref?.specifier).trim(),
    loadKind: utils_normalizeString(ref?.kind).trim() || 'import',
    bindingKind: utils_normalizeString(binding?.kind || 'named').trim() || 'named',
    importedName: utils_normalizeString(target?.importedName || binding?.imported).trim(),
    localName,
    inferred: Boolean(binding?.inferred),
  };
}

function createFunctionDependencyEdge({
  sourceDescriptor,
  targetDescriptor,
  scope,
  referenceLocations,
  importInfo = null,
}) {
  const usages = compactReferenceUsages(sourceDescriptor.record, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  const sourceNode = sourceDescriptor.node;
  const targetNode = targetDescriptor.node;
  return {
    id: functionDependencyEdgeId({ sourceNode, targetNode, scope, importInfo }),
    scope,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    sourceId: sourceNode.id,
    sourceModulePath: sourceNode.modulePath,
    sourceFunction: sourceNode.name,
    sourceKind: sourceNode.kind,
    sourceStartLine: sourceNode.startLine,
    sourceEndLine: sourceNode.endLine,
    targetId: targetNode.id,
    targetModulePath: targetNode.modulePath,
    targetFunction: targetNode.name,
    targetKind: targetNode.kind,
    targetStartLine: targetNode.startLine,
    targetEndLine: targetNode.endLine,
    ...(importInfo ? { import: importInfo } : {}),
  };
}

function mergeFunctionDependencyEdge(edgeMap, edge) {
  if (!edgeMap.has(edge.id)) {
    edgeMap.set(edge.id, edge);
    return;
  }

  const existing = edgeMap.get(edge.id);
  existing.referenceCount += edge.referenceCount;
  const usages = [...existing.usages, ...edge.usages]
    .filter((usage, index, all) => (
      all.findIndex((candidate) => (
        candidate.line === usage.line && candidate.syntax === usage.syntax
      )) === index
    ))
    .sort((a, b) => a.line - b.line || compareLocale(a.syntax, b.syntax));
  existing.usages = usages;
  existing.usageLines = usageLinesForUsages(usages);
  existing.syntaxKinds = syntaxKindsForUsages(usages);
  existing.relationKind = relationKindForSyntaxKinds(existing.syntaxKinds);
}

function buildSameModuleFunctionEdges({ byModulePath }) {
  const edgeMap = new Map();
  for (const descriptors of byModulePath.values()) {
    for (const callerDescriptor of descriptors) {
      const searchText = declarationSearchText(callerDescriptor.record, callerDescriptor.span);
      for (const targetDescriptor of descriptors) {
        if (callerDescriptor.node.id === targetDescriptor.node.id) continue;
        if (!searchText.includes(targetDescriptor.node.name)) continue;
        const referenceLocations = sameModuleReferenceLocations(
          callerDescriptor.record,
          callerDescriptor.span,
          targetDescriptor.span,
        );
        if (referenceLocations.length === 0) continue;
        mergeFunctionDependencyEdge(edgeMap, createFunctionDependencyEdge({
          sourceDescriptor: callerDescriptor,
          targetDescriptor,
          scope: 'same-module',
          referenceLocations,
        }));
      }
    }
  }
  return edgeMap;
}

function buildImportedFunctionEdges(graph, { bySpanKey }) {
  const edgeMap = new Map();
  for (const importerRecord of graph.modules.values()) {
    const importerSpans = declarationSpans(importerRecord)
      .filter((span) => ['function', 'arrow'].includes(span?.kind));
    if (importerSpans.length === 0) continue;
    for (const ref of Array.isArray(importerRecord.importRefs) ? importerRecord.importRefs : []) {
      const targetRecord = ref?.localRel ? graph.modules.get(ref.localRel) : null;
      if (!targetRecord) continue;
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.local) continue;
        for (const importerSpan of importerSpans) {
          const sourceDescriptor = bySpanKey.get(functionSpanKey(importerRecord, importerSpan));
          if (!sourceDescriptor) continue;
          for (const { targetRecord: resolvedTargetRecord, target, referenceLocations } of bindingReferenceGroups({
            graph,
            importerRecord,
            importerSpan,
            targetRecord,
            binding,
            ref,
          })) {
            const relationshipTargetRecord = resolvedTargetRecord || targetRecord;
            const targetDescriptor = bySpanKey.get(functionSpanKey(relationshipTargetRecord, target.span));
            if (!targetDescriptor || referenceLocations.length === 0) continue;
            mergeFunctionDependencyEdge(edgeMap, createFunctionDependencyEdge({
              sourceDescriptor,
              targetDescriptor,
              scope: 'imported',
              referenceLocations,
              importInfo: functionImportInfo(target, binding, ref),
            }));
          }
        }
      }
    }
  }
  return edgeMap;
}

function externalSpecifierCategory(specifier) {
  const raw = utils_normalizeString(specifier).trim();
  const withoutNodePrefix = raw.startsWith('node:') ? raw.slice('node:'.length) : raw;
  return raw.startsWith('node:') || PLATFORM_IMPORT_SPECIFIERS.has(withoutNodePrefix)
    ? 'platform'
    : 'package';
}

function placementExternalReferenceCategory(ref = {}) {
  const resolution = utils_normalizeString(ref.resolution).trim();
  if (resolution === 'unresolved') return 'unresolved';
  return externalSpecifierCategory(ref.specifier);
}

function compactExternalReferenceEvidence({
  importerRecord,
  sourceDescriptor,
  ref,
  binding,
  localName,
  importedName,
  referenceLocations,
}) {
  const usages = compactReferenceUsages(importerRecord, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  return {
    category: placementExternalReferenceCategory(ref),
    resolution: utils_normalizeString(ref.resolution).trim() || 'external',
    unresolvedReason: utils_normalizeString(ref.unresolvedReason).trim() || null,
    specifier: utils_normalizeString(ref.specifier).trim(),
    loadKind: utils_normalizeString(ref.kind).trim() || 'import',
    bindingKind: utils_normalizeString(binding?.kind || 'named').trim() || 'named',
    importedName: utils_normalizeString(importedName || binding?.imported).trim(),
    localName: utils_normalizeString(localName || binding?.local).trim(),
    modulePath: sourceDescriptor.node.modulePath,
    functionId: sourceDescriptor.node.id,
    functionStableId: sourceDescriptor.node.stableId || null,
    functionName: sourceDescriptor.node.name,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
  };
}

function compactBrowserPlatformReferenceEvidence({
  importerRecord,
  sourceDescriptor,
  specifier,
  importedName,
  localName,
  referenceLocations,
}) {
  const usages = compactReferenceUsages(importerRecord, referenceLocations);
  const syntaxKinds = syntaxKindsForUsages(usages);
  return {
    category: 'platform',
    resolution: 'platform',
    unresolvedReason: null,
    specifier,
    loadKind: 'browser-global',
    bindingKind: 'browser-global',
    importedName,
    localName,
    modulePath: sourceDescriptor.node.modulePath,
    functionId: sourceDescriptor.node.id,
    functionStableId: sourceDescriptor.node.stableId || null,
    functionName: sourceDescriptor.node.name,
    referenceCount: Array.isArray(referenceLocations) ? referenceLocations.length : 0,
    relationKind: relationKindForSyntaxKinds(syntaxKinds),
    syntaxKinds,
    usageLines: usageLinesForUsages(usages),
    usages,
  };
}

function compareExternalReferenceEvidence(a, b) {
  return compareLocale(a.category, b.category)
    || compareLocale(a.specifier, b.specifier)
    || compareLocale(a.localName, b.localName)
    || compareLocale(a.importedName, b.importedName)
    || compareLocale(a.bindingKind, b.bindingKind);
}

function mergeExternalReferenceEvidence(bucket, evidence) {
  const key = [
    evidence.category,
    evidence.resolution,
    evidence.specifier,
    evidence.loadKind,
    evidence.bindingKind,
    evidence.importedName,
    evidence.localName,
  ].join('\u0000');
  if (!bucket.has(key)) {
    bucket.set(key, evidence);
    return;
  }
  const existing = bucket.get(key);
  existing.referenceCount += evidence.referenceCount;
  const usages = [...existing.usages, ...evidence.usages]
    .filter((usage, index, all) => (
      all.findIndex((candidate) => (
        candidate.line === usage.line && candidate.syntax === usage.syntax
      )) === index
    ))
    .sort((a, b) => a.line - b.line || compareLocale(a.syntax, b.syntax));
  existing.usages = usages;
  existing.usageLines = usageLinesForUsages(usages);
  existing.syntaxKinds = syntaxKindsForUsages(usages);
  existing.relationKind = relationKindForSyntaxKinds(existing.syntaxKinds);
}

function externalBindingReferenceGroups({ importerRecord, importerSpan, binding, ref }) {
  const bindingKind = utils_normalizeString(binding?.kind || 'named').trim() || 'named';
  if (bindingKind === 'namespace') {
    return Array.from(namespaceMemberReferenceLocations(
      importerRecord,
      importerSpan,
      binding.local,
      { binding, ref },
    ), ([memberName, referenceLocations]) => ({
      localName: `${binding.local}.${memberName}`,
      importedName: memberName,
      referenceLocations,
    })).filter((group) => group.referenceLocations.length > 0);
  }

  const localName = normalizeIdentifier(binding?.local);
  if (!localName) return [];
  const referenceLocations = declarationReferenceLocations(
    importerRecord,
    importerSpan,
    localName,
    { binding, ref },
  );
  return referenceLocations.length > 0
    ? [{
      localName,
      importedName: utils_normalizeString(binding?.imported).trim(),
      referenceLocations,
    }]
    : [];
}

function isMemberPropertyReference(record, location) {
  const masked = maskIgnorableSyntax(record?.source);
  return masked[previousNonWhitespaceIndex(masked, location?.index)] === '.';
}

function browserPlatformReferenceGroups({ importerRecord, importerSpan }) {
  const groups = [];
  for (const [namespaceName, specifier] of BROWSER_PLATFORM_NAMESPACES) {
    for (const [memberName, referenceLocations] of namespaceMemberReferenceLocations(
      importerRecord,
      importerSpan,
      namespaceName,
    )) {
      if (referenceLocations.length === 0) continue;
      groups.push({
        specifier,
        importedName: memberName,
        localName: `${namespaceName}.${memberName}`,
        referenceLocations,
      });
    }
  }

  for (const [identifier, specifier] of BROWSER_PLATFORM_IDENTIFIERS) {
    const referenceLocations = declarationReferenceLocations(importerRecord, importerSpan, identifier)
      .filter((location) => !isMemberPropertyReference(importerRecord, location));
    if (referenceLocations.length === 0) continue;
    groups.push({
      specifier,
      importedName: identifier,
      localName: identifier,
      referenceLocations,
    });
  }
  return groups;
}

function buildExternalFunctionReferenceEvidence(graph, { bySpanKey }) {
  const evidenceByFunctionId = new Map();
  for (const importerRecord of graph.modules.values()) {
    const importerSpans = declarationSpans(importerRecord)
      .filter((span) => ['function', 'arrow'].includes(span?.kind));
    if (importerSpans.length === 0) continue;

    for (const importerSpan of importerSpans) {
      const sourceDescriptor = bySpanKey.get(functionSpanKey(importerRecord, importerSpan));
      if (!sourceDescriptor) continue;
      for (const group of browserPlatformReferenceGroups({ importerRecord, importerSpan })) {
        if (!evidenceByFunctionId.has(sourceDescriptor.node.id)) {
          evidenceByFunctionId.set(sourceDescriptor.node.id, new Map());
        }
        mergeExternalReferenceEvidence(
          evidenceByFunctionId.get(sourceDescriptor.node.id),
          compactBrowserPlatformReferenceEvidence({
            importerRecord,
            sourceDescriptor,
            specifier: group.specifier,
            importedName: group.importedName,
            localName: group.localName,
            referenceLocations: group.referenceLocations,
          }),
        );
      }
    }

    for (const ref of Array.isArray(importerRecord.importRefs) ? importerRecord.importRefs : []) {
      const resolution = utils_normalizeString(ref?.resolution).trim();
      if (resolution !== 'external' && resolution !== 'unresolved') continue;
      for (const binding of Array.isArray(ref.bindings) ? ref.bindings : []) {
        if (!binding?.local) continue;
        for (const importerSpan of importerSpans) {
          const sourceDescriptor = bySpanKey.get(functionSpanKey(importerRecord, importerSpan));
          if (!sourceDescriptor) continue;
          for (const group of externalBindingReferenceGroups({ importerRecord, importerSpan, binding, ref })) {
            if (!evidenceByFunctionId.has(sourceDescriptor.node.id)) {
              evidenceByFunctionId.set(sourceDescriptor.node.id, new Map());
            }
            mergeExternalReferenceEvidence(
              evidenceByFunctionId.get(sourceDescriptor.node.id),
              compactExternalReferenceEvidence({
                importerRecord,
                sourceDescriptor,
                ref,
                binding,
                localName: group.localName,
                importedName: group.importedName,
                referenceLocations: group.referenceLocations,
              }),
            );
          }
        }
      }
    }
  }

  return new Map(Array.from(evidenceByFunctionId, ([functionId, bucket]) => [
    functionId,
    Array.from(bucket.values()).sort(compareExternalReferenceEvidence),
  ]));
}

function compactPlacementFunctionNode(node = {}) {
  return {
    id: node.id,
    stableId: node.stableId || null,
    modulePath: node.modulePath,
    name: node.name,
    kind: node.kind,
    component: Boolean(node.component),
    exported: Boolean(node.exported),
    startLine: node.startLine,
    endLine: node.endLine,
    lineCount: node.lineCount,
  };
}

function compactPlacementEdge(edge = {}, functionById = new Map()) {
  const target = functionById.get(edge.targetId);
  const source = functionById.get(edge.sourceId);
  return {
    id: edge.id,
    scope: edge.scope,
    relationKind: edge.relationKind,
    syntaxKinds: edge.syntaxKinds,
    usageLines: edge.usageLines,
    referenceCount: edge.referenceCount,
    source: source ? compactPlacementFunctionNode(source) : null,
    target: target ? compactPlacementFunctionNode(target) : null,
    ...(edge.import ? { import: edge.import } : {}),
  };
}

function categoryCount(evidence, category) {
  return evidence.filter((item) => item.category === category).length;
}

function hasCallableSyntax(edges, references) {
  return [...edges, ...references]
    .some((item) => (Array.isArray(item.syntaxKinds) ? item.syntaxKinds : [])
      .some((kind) => kind !== 'reference'));
}

function transitiveInternalHelpersFor(node, sameFileEdgesBySourceId, functionById) {
  const results = [];
  const visited = new Set([node.id]);
  const queue = [{ id: node.id, depth: 0 }];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const edge of sameFileEdgesBySourceId.get(current.id) || []) {
      const target = functionById.get(edge.targetId);
      if (!target || visited.has(target.id)) continue;
      visited.add(target.id);
      if (target.modulePath === node.modulePath && !target.exported) {
        results.push({ depth: current.depth + 1, node: target, edge });
        queue.push({ id: target.id, depth: current.depth + 1 });
      }
    }
  }
  return results.sort((a, b) => a.depth - b.depth || compareFunctionNode(a.node, b.node));
}

function placementAssessment({ node, evidence, sameFileDependencies, projectLocalDependencies, sameFileUsers, projectLocalUsers }) {
  const sameFileEvidence = sameFileDependencies.length + sameFileUsers.length;
  const projectLocalEvidence = projectLocalDependencies.length + projectLocalUsers.length;
  const packageEvidence = categoryCount(evidence, 'package');
  const platformEvidence = categoryCount(evidence, 'platform');
  const unresolvedEvidence = categoryCount(evidence, 'unresolved');
  const allEdges = [
    ...sameFileDependencies,
    ...projectLocalDependencies,
    ...sameFileUsers,
    ...projectLocalUsers,
  ];
  const hasCallableEvidence = hasCallableSyntax(allEdges, evidence);
  const rationale = [];
  let assessment = 'static-isolated';
  let summary = 'No saved direct caller, callee, or import-binding reference evidence was found for this function.';

  if (node.exported || node.component) {
    assessment = 'public-entry-surface';
    summary = 'This function is exported or component-shaped, so placement should consider the module public surface as well as local helpers.';
    rationale.push(node.exported ? 'exported declaration' : 'component-shaped declaration');
  } else if (projectLocalEvidence > sameFileEvidence && projectLocalEvidence > 0) {
    assessment = 'review-for-extraction';
    summary = 'Cross-file static evidence outweighs same-file affinity; this function is a candidate for placement review.';
  } else if (sameFileEvidence > 0 && projectLocalEvidence > 0) {
    assessment = 'mixed-affinity';
    summary = 'Both same-file and project-local static evidence point at this function; review nearby callers and imported relationships together.';
  } else if (sameFileEvidence > 0) {
    assessment = 'keep-near-current-file';
    summary = 'Same-file static caller/callee evidence dominates, suggesting this function currently belongs near its surrounding file context.';
  } else if (projectLocalEvidence > 0) {
    assessment = 'review-for-extraction';
    summary = 'Only cross-file caller/callee evidence was found, so the current file placement deserves review.';
  } else if (packageEvidence + platformEvidence > 0) {
    assessment = 'external-adapter';
    summary = 'The function mostly shows package/platform import-binding use; placement depends on whether it is adapting those APIs for this file.';
  }

  if (sameFileEvidence > 0) rationale.push(`${sameFileEvidence} same-file caller/callee edge${sameFileEvidence === 1 ? '' : 's'}`);
  if (projectLocalEvidence > 0) rationale.push(`${projectLocalEvidence} project-local cross-file edge${projectLocalEvidence === 1 ? '' : 's'}`);
  if (packageEvidence > 0) rationale.push(`${packageEvidence} package binding reference${packageEvidence === 1 ? '' : 's'}`);
  if (platformEvidence > 0) rationale.push(`${platformEvidence} platform binding reference${platformEvidence === 1 ? '' : 's'}`);
  if (unresolvedEvidence > 0) rationale.push(`${unresolvedEvidence} unresolved import-binding reference${unresolvedEvidence === 1 ? '' : 's'}`);
  if (rationale.length === 0) rationale.push('no direct static affinity evidence');

  const resolvedEvidence = projectLocalEvidence + sameFileEvidence + packageEvidence + platformEvidence;
  const confidence = unresolvedEvidence > 0 || !hasCallableEvidence
    ? 'low'
    : resolvedEvidence >= 3 ? 'high' : 'medium';

  return {
    assessment,
    confidence,
    summary,
    rationale,
  };
}

function buildFunctionPlacementReview({ functions, edges, externalReferencesByFunctionId }) {
  const functionById = new Map(functions.map((node) => [node.id, node]));
  const dependenciesByFunctionId = new Map();
  const usersByFunctionId = new Map();
  const sameFileEdgesBySourceId = new Map();
  for (const edge of edges) {
    if (!dependenciesByFunctionId.has(edge.sourceId)) dependenciesByFunctionId.set(edge.sourceId, []);
    if (!usersByFunctionId.has(edge.targetId)) usersByFunctionId.set(edge.targetId, []);
    dependenciesByFunctionId.get(edge.sourceId).push(edge);
    usersByFunctionId.get(edge.targetId).push(edge);
    if (edge.scope === 'same-module') {
      if (!sameFileEdgesBySourceId.has(edge.sourceId)) sameFileEdgesBySourceId.set(edge.sourceId, []);
      sameFileEdgesBySourceId.get(edge.sourceId).push(edge);
    }
  }

  for (const node of functions) {
    const dependencies = dependenciesByFunctionId.get(node.id) || [];
    const users = usersByFunctionId.get(node.id) || [];
    const sameFileDependencies = dependencies.filter((edge) => edge.scope === 'same-module');
    const projectLocalDependencies = dependencies.filter((edge) => edge.scope === 'imported');
    const sameFileUsers = users.filter((edge) => edge.scope === 'same-module');
    const projectLocalUsers = users.filter((edge) => edge.scope === 'imported');
    const externalReferences = externalReferencesByFunctionId.get(node.id) || [];
    const directInternalHelpers = sameFileDependencies
      .map((edge) => functionById.get(edge.targetId))
      .filter((target) => target && target.modulePath === node.modulePath && !target.exported)
      .sort(compareFunctionNode);
    const transitiveInternalHelpers = transitiveInternalHelpersFor(node, sameFileEdgesBySourceId, functionById);
    const evidence = {
      sameFileCalleeCount: sameFileDependencies.length,
      projectLocalCalleeCount: projectLocalDependencies.length,
      packageCalleeCount: categoryCount(externalReferences, 'package'),
      platformCalleeCount: categoryCount(externalReferences, 'platform'),
      unresolvedCalleeCount: categoryCount(externalReferences, 'unresolved'),
      sameFileCallerCount: sameFileUsers.length,
      projectLocalCallerCount: projectLocalUsers.length,
      internalHelperCount: directInternalHelpers.length,
      transitiveInternalHelperCount: transitiveInternalHelpers.length,
      transitiveInternalHelperLineCount: transitiveInternalHelpers
        .reduce((total, item) => total + (item.node.lineCount || 0), 0),
    };
    node.placement = {
      assessment: placementAssessment({
        node,
        evidence: externalReferences,
        sameFileDependencies,
        projectLocalDependencies,
        sameFileUsers,
        projectLocalUsers,
      }),
      evidence,
      groups: {
        callees: {
          sameFile: sameFileDependencies.map((edge) => compactPlacementEdge(edge, functionById)),
          projectLocal: projectLocalDependencies.map((edge) => compactPlacementEdge(edge, functionById)),
          package: externalReferences.filter((item) => item.category === 'package'),
          platform: externalReferences.filter((item) => item.category === 'platform'),
          unresolved: externalReferences.filter((item) => item.category === 'unresolved'),
        },
        callers: {
          sameFile: sameFileUsers.map((edge) => compactPlacementEdge(edge, functionById)),
          projectLocal: projectLocalUsers.map((edge) => compactPlacementEdge(edge, functionById)),
        },
        internalHelpers: directInternalHelpers.map(compactPlacementFunctionNode),
        transitiveInternalHelpers: transitiveInternalHelpers.map((item) => ({
          depth: item.depth,
          function: compactPlacementFunctionNode(item.node),
          via: compactPlacementEdge(item.edge, functionById),
        })),
      },
    };
  }
}

function buildFunctionDependencyMap(graph) {
  const descriptorIndex = functionNodeDescriptors(graph);
  const functions = withCollisionSafeStableIds(
    descriptorIndex.descriptors
      .map((descriptor) => descriptor.node)
      .sort(compareFunctionNode),
    functionStableIdForNode,
  );
  const nodeById = new Map(functions.map((node) => [node.id, node]));
  for (const descriptor of descriptorIndex.descriptors) {
    const stableNode = nodeById.get(descriptor.node.id);
    if (stableNode) descriptor.node = stableNode;
  }
  const sameModuleEdges = buildSameModuleFunctionEdges(descriptorIndex);
  const importedEdges = buildImportedFunctionEdges(graph, descriptorIndex);
  const edges = [
    ...sameModuleEdges.values(),
    ...importedEdges.values(),
  ].sort(compareFunctionEdge);
  const externalReferencesByFunctionId = buildExternalFunctionReferenceEvidence(graph, descriptorIndex);
  buildFunctionPlacementReview({ functions, edges, externalReferencesByFunctionId });
  return {
    limitations: FUNCTION_DEPENDENCY_LIMITATIONS,
    functions,
    edges,
  };
}

function buildMermaid(graph, importEdges, declarationImportMetrics, { reachableOnly = false } = {}) {
  const jsxModules = jsxModuleRecords(graph, { reachableOnly });
  const classIds = buildClassIds(jsxModules);
  const lines = ['classDiagram'];
  if (jsxModules.length === 0) {
    lines.push('  %% No JSX modules found.');
    return lines.join('\n');
  }
  for (const record of jsxModules) {
    const classId = classIds.get(record.rel);
    const variables = importedScriptMembersForJsx(record, graph, declarationImportMetrics);
    const components = componentSpans(record);
    if (variables.length === 0 && components.length === 0) {
      lines.push(`  ${mermaidClassHeader(record, classId)}`);
      continue;
    }
    lines.push(`  ${mermaidClassHeader(record, classId)} {`);
    for (const variable of variables) {
      lines.push(`    +${memberMetricLabel(variable.name, variable.lineCount, variable.metrics)}`);
    }
    for (const [component] of components) {
      const lineCount = declarationLineCount(record, component);
      lines.push(`    +${memberMetricLabel(
        `${component}()`,
        lineCount,
        declarationImportMetricsFor(declarationImportMetrics, record, component),
      )}`);
    }
    lines.push('  }');
  }
  for (const edge of importEdges) {
    if (!classIds.has(edge.sourcePath) || !classIds.has(edge.targetPath)) continue;
    lines.push(`  ${edge.source} --> ${edge.target} : ${edgeRestingLabel(edge.loadKinds)}`);
  }
  return lines.join('\n');
}

function declarationSpanForFunctionNode(record, functionNode = {}) {
  return declarationSpans(record)
    .find((span) => (
      ['function', 'arrow'].includes(span?.kind)
      && span.kind === functionNode.kind
      && span.name === functionNode.declarationName
      && span.startLine === functionNode.startLine
      && span.endLine === functionNode.endLine
    )) || null;
}

function functionNodeModuleId(functionNode = {}) {
  return compactStableId('mod', [functionNode.modulePath]);
}

function sourceDeclarationEntryForFunctionNode({
  graph,
  functionNode,
  declarationImportMetrics,
  declarationRelationships,
}) {
  const record = graph.modules.get(functionNode?.modulePath);
  const span = declarationSpanForFunctionNode(record, functionNode);
  if (!record || !span) return null;
  return sourceDeclarationEntry({
    moduleId: functionNodeModuleId(functionNode),
    visibleName: functionNode.name,
    record,
    span,
    declarationName: functionNode.declarationName || functionNode.name,
    sourceOrigin: 'saved-function',
    metrics: declarationImportMetricsFor(declarationImportMetrics, record, functionNode.declarationName || functionNode.name),
    relationships: declarationRelationshipsFor(
      declarationRelationships,
      record,
      functionNode.declarationName || functionNode.name,
    ),
    functionNode,
  });
}

function buildSourceCode(graph, declarationImportMetrics, declarationRelationships, functionDependencyMap) {
  const jsxModules = jsxModuleRecords(graph, { reachableOnly: true });
  const classIds = buildClassIds(jsxModules);
  const functionNodes = functionNodesByDeclarationKey(functionDependencyMap);
  const modules = moduleRecords(graph)
    .map((record) => ({
      path: record.rel,
      lineCount: record.stats.lineCount,
      maxLineLength: record.stats.maxLineLength,
      code: record.source,
    }));
  const declarations = [];
  const seen = new Set();

  const pushEntry = (entry) => {
    const key = entry && [
      entry.moduleId,
      entry.sourceOrigin,
      entry.functionId || entry.name,
      entry.startLine,
      entry.endLine,
    ].join('\u0000');
    if (!entry || seen.has(key)) return;
    seen.add(key);
    declarations.push(entry);
  };

  for (const record of jsxModules) {
    const moduleId = classIds.get(record.rel);
    for (const entry of importedScriptSourceDeclarationsForJsx(
      record,
      graph,
      moduleId,
      declarationImportMetrics,
      declarationRelationships,
      functionNodes,
    )) {
      pushEntry(entry);
    }
    for (const [component, span] of componentSpans(record)) {
      pushEntry(sourceDeclarationEntry({
        moduleId,
        visibleName: component,
        record,
        span,
        sourceOrigin: 'current-file-declaration',
        metrics: declarationImportMetricsFor(declarationImportMetrics, record, component),
        relationships: declarationRelationshipsFor(declarationRelationships, record, component),
        functionNode: functionNodeForDeclaration(functionNodes, record, span, component),
      }));
    }
  }

  const representedFunctionIds = new Set(declarations
    .map((entry) => utils_normalizeString(entry.functionId).trim())
    .filter(Boolean));
  for (const functionNode of Array.isArray(functionDependencyMap?.functions) ? functionDependencyMap.functions : []) {
    if (representedFunctionIds.has(functionNode.id)) continue;
    const entry = sourceDeclarationEntryForFunctionNode({
      graph,
      functionNode,
      declarationImportMetrics,
      declarationRelationships,
    });
    if (!entry) continue;
    pushEntry(entry);
    if (entry.functionId) representedFunctionIds.add(entry.functionId);
  }

  return { modules, declarations };
}

function buildTreeText(graph) {
  const entry = graph.modules.get(graph.entryRel);
  if (!entry) return '';
  const lines = [];
  const seen = new Set();
  const visit = (rel, depth) => {
    const prefix = depth === 0 ? '' : `${'  '.repeat(depth - 1)}- `;
    lines.push(`${prefix}${rel}`);
    if (seen.has(rel)) return;
    seen.add(rel);
    const record = graph.modules.get(rel);
    if (!record) return;
    for (const dep of [...record.localDeps].sort(compareLocale)) {
      visit(dep, depth + 1);
    }
    for (const external of [...record.externalDeps].sort(compareLocale)) {
      lines.push(`${'  '.repeat(depth)}- [external] ${external}`);
    }
  };
  visit(entry.rel, 0);
  return lines.join('\n');
}

function createTreeNode() {
  return {
    dirs: new Map(),
    files: [],
  };
}

function buildJsxTreeText(jsxScripts) {
  if (!Array.isArray(jsxScripts) || jsxScripts.length === 0) return 'No JSX files found.';
  const root = createTreeNode();

  for (const script of jsxScripts) {
    const parts = toPosixPath(script.path).split('/').filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) continue;

    let node = root;
    for (const dirName of parts) {
      if (!node.dirs.has(dirName)) node.dirs.set(dirName, createTreeNode());
      node = node.dirs.get(dirName);
    }
    node.files.push({
      name: fileName,
      lineCount: script.lineCount,
    });
  }

  const lines = ['.'];
  const render = (node, prefix) => {
    const entries = [
      ...Array.from(node.dirs, ([name, child]) => ({ type: 'dir', name, child })),
      ...node.files.map((file) => ({ type: 'file', ...file })),
    ].sort((a, b) => compareLocale(a.name, b.name) || compareLocale(a.type, b.type));

    entries.forEach((entry, index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? '`-- ' : '|-- ';
      if (entry.type === 'file') {
        lines.push(`${prefix}${connector}${entry.name} (${formatLineCount(entry.lineCount)})`);
        return;
      }
      lines.push(`${prefix}${connector}${entry.name}`);
      render(entry.child, `${prefix}${isLast ? '    ' : '|   '}`);
    });
  };

  render(root, '');
  return lines.join('\n');
}

function buildReachableModuleSet(modules, entryRel) {
  const reachable = new Set();
  const queue = [entryRel];
  while (queue.length > 0) {
    const rel = queue.shift();
    if (!rel || reachable.has(rel) || !modules.has(rel)) continue;
    reachable.add(rel);
    const record = modules.get(rel);
    for (const dep of Array.isArray(record.localDeps) ? record.localDeps : []) {
      if (!reachable.has(dep)) queue.push(dep);
    }
  }
  return reachable;
}

function reachableGraphView(graph) {
  return {
    ...graph,
    modules: new Map(moduleRecords(graph, { reachableOnly: true }).map((record) => [record.rel, record])),
  };
}

function uniqueRecords(records, keyFor) {
  const byKey = new Map();
  for (const record of records) {
    const key = keyFor(record);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, record);
  }
  return Array.from(byKey.values());
}

function componentKey(modulePath, name) {
  return `${modulePath}\u0000${name}`;
}

function buildComponents(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.components) ? record.components : [])
      .map((component) => ({
        ...component,
        modulePath: record.rel,
        reachable: Boolean(record.reachable),
      })))
    .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
      || compareLocale(a.name, b.name)
      || a.startLine - b.startLine);
}

function importedBindingComponentTarget(record, graph, componentByModuleAndName, localName) {
  for (const ref of Array.isArray(record.importRefs) ? record.importRefs : []) {
    if (!ref.localRel) continue;
    const binding = (Array.isArray(ref.bindings) ? ref.bindings : [])
      .find((candidate) => candidate.local === localName);
    if (!binding) continue;
    const targetName = binding.imported === 'default' ? defaultExportDeclarationName(graph.modules.get(ref.localRel)) : binding.imported;
    const key = componentKey(ref.localRel, targetName || localName);
    if (componentByModuleAndName.has(key)) return componentByModuleAndName.get(key);
  }
  return null;
}

function buildComponentRenderEdges(graph, components) {
  const componentByModuleAndName = new Map(components.map((component) => [
    componentKey(component.modulePath, component.name),
    component,
  ]));
  const edges = [];
  for (const record of moduleRecords(graph)) {
    for (const ref of Array.isArray(record.componentRefs) ? record.componentRefs : []) {
      if (!ref.owner || ref.owner === ref.component) continue;
      const localTarget = componentByModuleAndName.get(componentKey(record.rel, ref.component));
      const importedTarget = localTarget || importedBindingComponentTarget(record, graph, componentByModuleAndName, ref.component);
      edges.push({
        sourceModulePath: record.rel,
        sourceComponent: ref.owner,
        targetModulePath: importedTarget?.modulePath || null,
        targetComponent: importedTarget?.name || ref.component,
        kind: ref.sourceKind || 'jsx-element',
        line: ref.line,
        resolved: Boolean(importedTarget || localTarget),
      });
    }
  }
  return uniqueRecords(edges, (edge) => [
    edge.sourceModulePath,
    edge.sourceComponent,
    edge.targetModulePath || '',
    edge.targetComponent,
    edge.kind,
    edge.line,
  ].join('\u0000')).sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
    || compareLocale(a.sourceComponent, b.sourceComponent)
    || compareLocale(a.targetModulePath || '', b.targetModulePath || '')
    || compareLocale(a.targetComponent, b.targetComponent)
    || a.line - b.line);
}

function buildRoutes(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.routes) ? record.routes : [])
      .map((route) => ({
        ...route,
        modulePath: record.rel,
        reachable: Boolean(record.reachable),
      })))
    .sort((a, b) => compareLocale(a.path, b.path)
      || compareLocale(a.modulePath, b.modulePath)
      || compareLocale(a.component, b.component)
      || a.line - b.line);
}

function buildBrowserApis(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.browserApis) ? record.browserApis : [])
      .map((api) => ({
        ...api,
        modulePath: record.rel,
        reachable: Boolean(record.reachable),
      })))
    .sort((a, b) => compareLocale(a.api, b.api)
      || compareLocale(a.modulePath, b.modulePath)
      || a.line - b.line);
}

function buildCommonJsSyntax(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.commonJsRefs) ? record.commonJsRefs : [])
      .map((ref) => ({
        ...ref,
        modulePath: record.rel,
        reachable: Boolean(record.reachable),
      })))
    .sort((a, b) => compareLocale(a.modulePath, b.modulePath)
      || a.line - b.line
      || compareLocale(a.kind, b.kind));
}

function assetRecordForRef(record, ref) {
  return {
    sourceModulePath: record.rel,
    specifier: ref.specifier,
    path: ref.assetRel || ref.localRel || null,
    kind: ref.kind === 'worker' ? 'worker' : ref.assetKind || 'unknown',
    loadKind: ref.kind,
    resolved: ref.resolution === 'asset' || (ref.kind === 'worker' && ref.resolution === 'local'),
  };
}

function buildAssets(graph) {
  return uniqueRecords(moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.importRefs) ? record.importRefs : [])
      .filter((ref) => ref.resolution === 'asset' || ref.kind === 'worker')
      .map((ref) => assetRecordForRef(record, ref))), (asset) => [
      asset.sourceModulePath,
      asset.specifier,
      asset.path || '',
      asset.loadKind,
    ].join('\u0000'))
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || compareLocale(a.path || '', b.path || '')
      || compareLocale(a.specifier, b.specifier));
}

function buildLazyBoundaries(graph) {
  return uniqueRecords(moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.importRefs) ? record.importRefs : [])
      .filter((ref) => ['lazy', 'dynamic', 'worker'].includes(ref.kind))
      .map((ref) => ({
        sourceModulePath: record.rel,
        targetModulePath: ref.localRel || null,
        specifier: ref.specifier,
        kind: ref.kind === 'worker' ? 'worker' : ref.kind === 'lazy' ? 'react-lazy' : 'dynamic-import',
        resolved: ref.resolution === 'local',
      }))), (boundary) => [
      boundary.sourceModulePath,
      boundary.targetModulePath || '',
      boundary.specifier,
      boundary.kind,
    ].join('\u0000'))
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || compareLocale(a.targetModulePath || '', b.targetModulePath || '')
      || compareLocale(a.specifier, b.specifier));
}

function buildRemoteImports(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.importRefs) ? record.importRefs : [])
      .filter((ref) => ref.resolution === 'remote')
      .map((ref) => ({
        sourceModulePath: record.rel,
        specifier: ref.specifier,
        loadKind: ref.kind,
      })))
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || compareLocale(a.specifier, b.specifier));
}

function buildUnresolvedImports(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.importRefs) ? record.importRefs : [])
      .filter((ref) => ref.resolution === 'unresolved')
      .map((ref) => ({
        sourceModulePath: record.rel,
        specifier: ref.specifier,
        loadKind: ref.kind,
        unresolvedReason: ref.unresolvedReason || 'not_found',
      })))
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || compareLocale(a.specifier, b.specifier));
}

function buildBrowserIncompatibleImports(graph) {
  return moduleRecords(graph)
    .flatMap((record) => (Array.isArray(record.importRefs) ? record.importRefs : [])
      .filter((ref) => ref.resolution === 'browser-incompatible')
      .map((ref) => ({
        sourceModulePath: record.rel,
        specifier: ref.specifier,
        nodeBuiltin: ref.nodeBuiltin || nodeBuiltinSpecifier(ref.specifier),
        loadKind: ref.kind,
      })))
    .sort((a, b) => compareLocale(a.sourceModulePath, b.sourceModulePath)
      || compareLocale(a.specifier, b.specifier));
}

function frontEndFindings({ unresolvedImports, browserIncompatibleImports, remoteImports, commonJsSyntax }) {
  return [
    ...browserIncompatibleImports.map((item) => ({
      id: compactStableId('finding', ['browser-incompatible-import', item.sourceModulePath, item.specifier]),
      ruleId: 'IRONG_FRONTEND_NODE_IMPORT',
      severity: 'error',
      message: `Browser-reachable module imports Node builtin "${item.specifier}".`,
      modulePath: item.sourceModulePath,
      evidence: item,
    })),
    ...unresolvedImports.map((item) => ({
      id: compactStableId('finding', ['unresolved-import', item.sourceModulePath, item.specifier, item.loadKind]),
      ruleId: 'IRONG_UNRESOLVED_IMPORT',
      severity: 'error',
      message: `Browser entry has unresolved import "${item.specifier}".`,
      modulePath: item.sourceModulePath,
      evidence: item,
    })),
    ...remoteImports.map((item) => ({
      id: compactStableId('finding', ['remote-import', item.sourceModulePath, item.specifier, item.loadKind]),
      ruleId: 'IRONG_REMOTE_IMPORT',
      severity: 'warning',
      message: `Browser entry uses remote import "${item.specifier}".`,
      modulePath: item.sourceModulePath,
      evidence: item,
    })),
    ...commonJsSyntax.map((item) => ({
      id: compactStableId('finding', ['commonjs-syntax', item.modulePath, item.kind, item.line]),
      ruleId: 'IRONG_UNSUPPORTED_COMMONJS',
      severity: 'error',
      message: `Browser module contains unsupported CommonJS ${item.kind}.`,
      modulePath: item.modulePath,
      evidence: item,
    })),
  ].sort((a, b) => compareLocale(a.severity, b.severity)
    || compareLocale(a.ruleId, b.ruleId)
    || compareLocale(a.modulePath, b.modulePath)
    || compareLocale(a.id, b.id));
}

function filterGraphToReachable(graph) {
  const reachableModules = new Map(moduleRecords(graph, { reachableOnly: true }).map((record) => [record.rel, record]));
  const externals = new Set();
  for (const record of reachableModules.values()) {
    record.localDeps = record.localDeps.filter((dep) => reachableModules.has(dep));
    for (const external of record.externalDeps) externals.add(external);
  }
  graph.modules = reachableModules;
  graph.externals = externals;
  graph.reachableModules = new Set(reachableModules.keys());
}

function entryModuleDiscoveryRoot(moduleRel) {
  const rel = normalizeExclude(moduleRel);
  if (!rel) return '';
  const parts = rel.split('/').filter(Boolean);
  if (parts.length > 1 && ['src', 'app', 'client', 'frontend', 'web', 'public'].includes(parts[0])) return parts[0];
  const dir = external_node_path_namespaceObject.posix.dirname(rel);
  return dir === '.' ? '' : dir;
}

function includeUnreachableDiscoveryRoots({ sourceRoot, entryModules }) {
  const normalizedSourceRoot = normalizeExclude(sourceRoot);
  if (normalizedSourceRoot && normalizedSourceRoot !== '.') return [normalizedSourceRoot];
  const roots = Array.from(new Set((Array.isArray(entryModules) ? entryModules : [])
    .map((entryModule) => entryModuleDiscoveryRoot(entryModule.rel))
    .filter((root) => root)));
  return roots.length > 0 ? roots.sort(compareLocale) : [''];
}

async function moduleEntriesForHtmlEntry({ rootDir, htmlEntry, routeAliases }) {
  const html = await promises_namespaceObject.readFile(htmlEntry.filePath, 'utf8');
  const parsed = parseHtmlEntry(html);
  const entryDir = external_node_path_namespaceObject.posix.dirname(htmlEntry.rel);
  const resolvedEntries = [];
  for (const src of parsed.moduleScriptSrcs) {
    const resolved = await resolveImport({
      rootDir,
      specifier: src,
      importerRel: htmlEntry.rel,
      aliases: parsed.importAliases,
      routeAliases,
    }) || await resolveBrowserPathFromRoot(rootDir, external_node_path_namespaceObject.posix.normalize(external_node_path_namespaceObject.posix.join(entryDir, src)));
    if (resolved?.kind === 'module') resolvedEntries.push(resolved);
  }
  if (resolvedEntries.length === 0) {
    throw new Error(`HTML entry ${htmlEntry.rel} does not contain a resolvable <script type="module" src="...">.`);
  }
  return {
    aliases: parsed.importAliases,
    entries: uniqueRecords(resolvedEntries, (item) => item.rel).sort((a, b) => compareLocale(a.rel, b.rel)),
  };
}

async function analyzeProject({
  rootDir,
  entry,
  moduleLimit = DEFAULT_MODULE_LIMIT,
  routeAliases = [],
  aliases: explicitAliases = [],
  framework = DEFAULT_FRAMEWORK,
  sourceRoot = '',
  includeUnreachable = false,
  exclude = [],
} = {}) {
  const effectiveModuleLimit = normalizeModuleLimit(moduleLimit);
  const effectiveFramework = normalizeFramework(framework);
  const requestedRoot = external_node_path_namespaceObject.resolve(utils_normalizeString(rootDir).trim() || '.');
  const normalizedSourceRoot = normalizeRouteAliasTarget(sourceRoot);
  const resolvedSourceRoot = normalizedSourceRoot
    ? external_node_path_namespaceObject.resolve(requestedRoot, normalizedSourceRoot)
    : requestedRoot;
  if (!isWithinPath(requestedRoot, resolvedSourceRoot)) {
    throw new Error('--source-root must stay inside the project root.');
  }
  const resolvedRouteAliases = [
    ...normalizeRouteAliases(routeAliases),
    ...DEFAULT_ROUTE_ALIASES,
  ];
  let resolvedEntry = await resolveEntry(requestedRoot, entry);
  let htmlEntry = null;
  if (resolvedEntry.kind === 'html') {
    try {
      htmlEntry = await moduleEntriesForHtmlEntry({ rootDir: requestedRoot, htmlEntry: resolvedEntry, routeAliases: resolvedRouteAliases });
    } catch (error) {
      if (utils_normalizeString(entry).trim()) throw error;
      resolvedEntry = await resolveEntry(requestedRoot, entry, { allowHtml: false });
    }
  }
  const entryModules = htmlEntry
    ? htmlEntry.entries
    : [resolvedEntry];
  const aliases = mergeAliasMaps(
    await loadImportAliases(requestedRoot, resolvedEntry.rel),
    htmlEntry?.aliases || new Map(),
    normalizeImportAliases(explicitAliases),
  );
  const normalizedExcludes = normalizeExcludes(exclude);
  for (const entryModule of entryModules) {
    if (!isAnalyzableModulePath(entryModule.rel)) {
      throw new Error(`Entry ${entryModule.rel} is not a browser JavaScript module (.js, .jsx, .mjs).`);
    }
    if (pathMatchesExclude(entryModule.rel, normalizedExcludes)) {
      throw new Error(`Entry ${entryModule.rel} is excluded from analysis.`);
    }
  }
  const astContext = createJavaScriptAstAnalysisContext();
  const modules = new Map();
  const queuedModules = new Map();
  const externals = new Set();

  const enqueueModule = (module) => {
    if (!module?.rel || modules.has(module.rel) || queuedModules.has(module.rel)) return;
    if (pathMatchesExclude(module.rel, normalizedExcludes)) return;
    if (modules.size + queuedModules.size >= effectiveModuleLimit) {
      throw new Error(`Module limit exceeded (${effectiveModuleLimit}).`);
    }
    queuedModules.set(module.rel, module);
  };

  const analyzeModule = async (current, {
    enqueueReachableImports = false,
    allowedUnreachableModules = null,
  } = {}) => {
    if (modules.has(current.rel)) return;
    if (modules.size >= effectiveModuleLimit) {
      throw new Error(`Module limit exceeded (${effectiveModuleLimit}).`);
    }
    const source = await promises_namespaceObject.readFile(current.filePath, 'utf8');
    const ast = astContext.analyzeFile(current.filePath, source);
    const importRefs = ast.importRefs;
    const localDeps = [];
    const externalDeps = [];
    const normalizedImportRefs = [];

    for (const ref of importRefs) {
      const nodeBuiltin = nodeBuiltinSpecifier(ref.specifier);
      if (nodeBuiltin) {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          resolution: 'browser-incompatible',
          unresolvedReason: 'node_builtin',
          nodeBuiltin,
        });
        continue;
      }

      if (isRemoteSpecifier(ref.specifier)) {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          resolution: 'remote',
          unresolvedReason: null,
        });
        continue;
      }

      const remoteAliasTarget = remoteAliasTargetForSpecifier(ref.specifier, aliases);
      if (remoteAliasTarget) {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          remoteUrl: remoteAliasTarget,
          resolution: 'remote',
          unresolvedReason: null,
        });
        continue;
      }

      const local = await resolveImport({
        rootDir: requestedRoot,
        specifier: ref.specifier,
        importerRel: current.rel,
        aliases,
        routeAliases: resolvedRouteAliases,
      });
      const localModuleAllowed = local?.kind === 'module'
        && !pathMatchesExclude(local.rel, normalizedExcludes)
        && (enqueueReachableImports || !allowedUnreachableModules || modules.has(local.rel) || allowedUnreachableModules.has(local.rel));
      if (localModuleAllowed) {
        localDeps.push(local.rel);
        normalizedImportRefs.push({
          ...ref,
          localRel: local.rel,
          resolution: 'local',
          unresolvedReason: null,
        });
        if (enqueueReachableImports) enqueueModule(local);
      } else if (local?.kind === 'asset') {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          assetRel: local.rel,
          assetKind: local.assetKind || 'unknown',
          resolution: 'asset',
          unresolvedReason: null,
        });
      } else if (local?.kind === 'unsupported-module') {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          resolution: 'unresolved',
          unresolvedReason: `unsupported_module_type${local.unsupportedExtension ? `:${local.unsupportedExtension}` : ''}`,
        });
      } else if (importSpecifierLooksLocal(ref.specifier, aliases, resolvedRouteAliases)) {
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          resolution: 'unresolved',
          unresolvedReason: local ? 'outside_analysis' : 'not_found',
        });
      } else {
        const label = externalLabel(ref.specifier);
        if (label && !isIgnoredExternalLabel(label)) {
          externals.add(label);
          externalDeps.push(label);
        }
        normalizedImportRefs.push({
          ...ref,
          localRel: null,
          resolution: 'external',
          unresolvedReason: null,
        });
      }
    }

    modules.set(current.rel, {
      rel: current.rel,
      source,
      stats: scriptStats(current.rel, source),
      declarationSpans: ast.declarationSpans,
      typeOnlyRanges: ast.typeOnlyRanges,
      components: ast.components,
      componentRefs: ast.componentRefs,
      routes: effectiveFramework === 'vanilla' ? [] : ast.routes,
      browserApis: ast.browserApis,
      commonJsRefs: ast.commonJsRefs,
      importRefs: normalizedImportRefs,
      localDeps: Array.from(new Set(localDeps)).sort(compareLocale),
      externalDeps: Array.from(new Set(externalDeps)).sort(compareLocale),
    });
  };

  for (const entryModule of entryModules) enqueueModule(entryModule);
  while (queuedModules.size > 0) {
    const [rel, current] = Array.from(queuedModules).sort(([left], [right]) => compareLocale(left, right))[0];
    queuedModules.delete(rel);
    await analyzeModule(current, { enqueueReachableImports: true });
  }

  if (includeUnreachable) {
    const discoveryRoots = includeUnreachableDiscoveryRoots({
      sourceRoot: normalizedSourceRoot,
      entryModules,
    });
    const discoveredModules = await discoverAnalyzableModules(
      requestedRoot,
      effectiveModuleLimit,
      normalizedExcludes,
      discoveryRoots,
    );
    const allowedUnreachableModules = new Set(discoveredModules.map((module) => module.rel));
    for (const current of discoveredModules) {
      await analyzeModule(current, { allowedUnreachableModules });
    }
  }

  const reachableModules = new Set();
  for (const entryModule of entryModules) {
    for (const rel of buildReachableModuleSet(modules, entryModule.rel)) reachableModules.add(rel);
  }
  for (const record of modules.values()) {
    record.reachable = reachableModules.has(record.rel);
  }

  const graph = {
    rootDir: requestedRoot,
    projectRoot: requestedRoot,
    sourceRoot: normalizedSourceRoot || '.',
    entryRel: resolvedEntry.rel,
    entryKind: resolvedEntry.kind,
    entryModuleRels: entryModules.map((module) => module.rel).sort(compareLocale),
    modules,
    reachableModules,
    externals,
  };
  if (!includeUnreachable) filterGraphToReachable(graph);

  const jsScripts = moduleRecords(graph)
    .map((record) => ({ ...record.stats, reachable: Boolean(record.reachable) }))
    .sort((a, b) => compareLocale(a.path, b.path));
  const jsxScripts = jsScripts
    .filter((script) => isJsxModule(script.path))
    .sort((a, b) => compareLocale(a.path, b.path));
  const reachableJsScripts = jsScripts
    .filter((script) => script.reachable)
    .sort((a, b) => compareLocale(a.path, b.path));
  const reachableJsxScripts = reachableJsScripts
    .filter((script) => isJsxModule(script.path))
    .sort((a, b) => compareLocale(a.path, b.path));
  const jsxClassCount = reachableJsxScripts.length;
  const reachableGraph = reachableGraphView(graph);
  const importEdges = buildImportEdges(graph, { reachableOnly: true });
  const reachableDeclarationImportMetrics = buildDeclarationImportMetrics(reachableGraph);
  const declarationRelationships = buildDeclarationRelationships(graph);
  const functionDependencyMap = buildFunctionDependencyMap(graph);
  const mermaid = buildMermaid(graph, importEdges, reachableDeclarationImportMetrics, { reachableOnly: true });
  const sourceCode = buildSourceCode(
    graph,
    reachableDeclarationImportMetrics,
    declarationRelationships,
    functionDependencyMap,
  );
  const treeText = buildTreeText(graph);
  const jsxTreeText = buildJsxTreeText(reachableJsxScripts);
  const components = buildComponents(graph);
  const componentEdges = buildComponentRenderEdges(graph, components);
  const routes = buildRoutes(graph);
  const browserApis = buildBrowserApis(graph);
  const commonJsSyntax = buildCommonJsSyntax(graph);
  const assets = buildAssets(graph);
  const lazyBoundaries = buildLazyBoundaries(graph);
  const remoteImports = buildRemoteImports(graph);
  const unresolvedImports = buildUnresolvedImports(graph);
  const browserIncompatibleImports = buildBrowserIncompatibleImports(graph);
  const findings = frontEndFindings({
    unresolvedImports,
    browserIncompatibleImports,
    remoteImports,
    commonJsSyntax,
  });

  return {
    rootDir: requestedRoot,
    entryRel: resolvedEntry.rel,
    entryKind: resolvedEntry.kind,
    entryModules: graph.entryModuleRels,
    graph,
    treeText,
    jsxTreeText,
    jsScripts,
    jsxScripts,
    mermaid,
    importEdges,
    components,
    componentEdges,
    routes,
    lazyBoundaries,
    assets,
    browserApis,
    remoteImports,
    unresolvedImports,
    browserIncompatibleImports,
    commonJsSyntax,
    findings,
    sourceCode,
    functionDependencyMap,
    metadata: {
      analyzer: {
        ...astContext.analyzer,
      },
      backend: {
        ...astContext.analyzer,
      },
      framework: effectiveFramework,
      includeUnreachable: Boolean(includeUnreachable),
      excludes: normalizedExcludes,
      aliases: Array.from(aliases, ([from, to]) => ({ from, to })).sort((a, b) => compareLocale(a.from, b.from)),
      moduleLimit: {
        limit: effectiveModuleLimit,
        count: modules.size,
      },
    },
    summary: {
      moduleCount: modules.size,
      reachableModuleCount: reachableModules.size,
      unreachableModuleCount: modules.size - reachableModules.size,
      jsxClassCount,
      jsxFileCount: jsxScripts.length,
      reachableJsxFileCount: reachableJsxScripts.length,
      jsScriptCount: jsScripts.length,
      reachableJsScriptCount: reachableJsScripts.length,
      externalCount: graph.externals.size,
      componentCount: components.length,
      componentEdgeCount: componentEdges.length,
      routeCount: routes.length,
      lazyBoundaryCount: lazyBoundaries.length,
      assetCount: assets.length,
      browserApiCount: browserApis.length,
      remoteImportCount: remoteImports.length,
      unresolvedImportCount: unresolvedImports.length,
      browserIncompatibleImportCount: browserIncompatibleImports.length,
      findingCount: findings.length,
    },
  };
}

;// CONCATENATED MODULE: ./src/lib/diff-command.js













const execFile = (0,external_node_util_namespaceObject.promisify)(external_node_child_process_namespaceObject.execFile);
const SNAPSHOT_SCHEMA_VERSION = '1.2.0';

function diff_command_stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => diff_command_stableJson(item)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${diff_command_stableJson(value[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value);
}

function contentHash(value) {
  return (0,external_node_crypto_namespaceObject.createHash)('sha256').update(diff_command_stableJson(value)).digest('hex');
}

async function readJsonFile(filePath) {
  let text = '';
  try {
    text = await promises_namespaceObject.readFile(filePath, 'utf8');
  } catch (error) {
    throw new diff_snapshots_SnapshotDiffError(`Unable to read snapshot ${filePath}: ${error.message}`, 'snapshot_read_failed');
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new diff_snapshots_SnapshotDiffError(`Malformed JSON in snapshot ${filePath}: ${error.message}`, 'malformed_snapshot');
  }
}

async function readReviewJsonFile(filePath, label, code) {
  let text = '';
  try {
    text = await promises_namespaceObject.readFile(filePath, 'utf8');
  } catch (error) {
    const detail = error?.code ? ` (${error.code})` : '';
    throw new DiffReviewError(`Unable to read ${label}${detail}.`, code);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new DiffReviewError(`Malformed JSON in ${label}: ${error.message}`, code);
  }
}

async function snapshotPathForInput(input) {
  const resolved = external_node_path_namespaceObject.resolve(utils_normalizeString(input).trim());
  try {
    const stat = await promises_namespaceObject.stat(resolved);
    if (stat.isDirectory()) {
      const outputPath = external_node_path_namespaceObject.join(resolved, 'output.json');
      try {
        const outputStat = await promises_namespaceObject.stat(outputPath);
        return outputStat.isFile() ? outputPath : null;
      } catch {
        return null;
      }
    }
    if (stat.isFile()) return resolved;
  } catch {
    // Git-ref support is added by the CLI loader; missing paths fall through to a clear error here.
  }
  return null;
}

function safeSnapshotLabel(input, snapshotPath) {
  const raw = utils_normalizeString(input).trim();
  if (!raw) return 'snapshot';
  if (external_node_path_namespaceObject.isAbsolute(raw)) {
    return external_node_path_namespaceObject.basename(raw) || external_node_path_namespaceObject.basename(snapshotPath) || 'snapshot';
  }
  return raw
    .replace(/\\/g, '/')
    .replace(/^[A-Za-z]:\//, '')
    .replace(/^\/+/, '')
    || external_node_path_namespaceObject.basename(snapshotPath)
    || 'snapshot';
}

async function loadSnapshotFromPath(input) {
  const snapshotPath = await snapshotPathForInput(input);
  if (!snapshotPath) {
    throw new SnapshotDiffError(`Unable to resolve diff input "${input}" as a snapshot file or generated-site directory.`, 'input_not_found');
  }
  return {
    label: safeSnapshotLabel(input, snapshotPath),
    snapshotPath,
    snapshot: await readJsonFile(snapshotPath),
  };
}

async function resolveGitCommit(projectRoot, input) {
  try {
    const { stdout } = await execFile('git', ['-C', projectRoot, 'rev-parse', '--verify', `${input}^{commit}`]);
    const commit = stdout.trim();
    return /^[a-f0-9]{40}$/i.test(commit) ? commit : null;
  } catch {
    return null;
  }
}

async function gitTopLevel(projectRoot) {
  try {
    const { stdout } = await execFile('git', ['-C', projectRoot, 'rev-parse', '--show-toplevel']);
    return external_node_path_namespaceObject.resolve(stdout.trim());
  } catch {
    return projectRoot;
  }
}

function waitForChild(child, name, stderrChunks) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new diff_snapshots_SnapshotDiffError(
        `${name} exited with code ${code}: ${Buffer.concat(stderrChunks).toString('utf8').trim()}`,
        'git_archive_failed',
      ));
    });
  });
}

async function materializeGitCommit(projectRoot, commit) {
  const tempRoot = await promises_namespaceObject.mkdtemp(external_node_path_namespaceObject.join(external_node_os_namespaceObject.tmpdir(), 'ironglancer-diff-ref-'));
  const checkoutDir = external_node_path_namespaceObject.join(tempRoot, 'checkout');
  await promises_namespaceObject.mkdir(checkoutDir, { recursive: true });
  const gitStderr = [];
  const tarStderr = [];
  const git = (0,external_node_child_process_namespaceObject.spawn)('git', ['-C', projectRoot, 'archive', '--format=tar', commit], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const tar = (0,external_node_child_process_namespaceObject.spawn)('tar', ['-xf', '-', '-C', checkoutDir], {
    stdio: ['pipe', 'ignore', 'pipe'],
  });
  git.stderr.on('data', (chunk) => gitStderr.push(chunk));
  tar.stderr.on('data', (chunk) => tarStderr.push(chunk));
  git.stdout.pipe(tar.stdin);
  try {
    await Promise.all([
      waitForChild(git, 'git archive', gitStderr),
      waitForChild(tar, 'tar', tarStderr),
    ]);
    return {
      tempRoot,
      checkoutDir,
      async cleanup() {
        await promises_namespaceObject.rm(tempRoot, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await promises_namespaceObject.rm(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function analysisModulesPayload(analysis = {}) {
  const modules = analysis?.graph?.modules instanceof Map
    ? Array.from(analysis.graph.modules.values())
    : [];
  return modules
    .map((record) => ({
      path: record.rel,
      lineCount: record.stats?.lineCount || 0,
      maxLineLength: record.stats?.maxLineLength || 0,
      reachable: Boolean(record.reachable),
      isJsx: /\.jsx$/i.test(record.rel),
      localDependencies: Array.isArray(record.localDeps) ? record.localDeps : [],
      externalDependencies: Array.isArray(record.externalDeps) ? record.externalDeps : [],
      importRefs: Array.isArray(record.importRefs) ? record.importRefs.map((ref) => ({
        specifier: typeof ref.specifier === 'string' ? ref.specifier : '',
        kind: typeof ref.kind === 'string' ? ref.kind : '',
        typeOnly: Boolean(ref.typeOnly),
        localRel: typeof ref.localRel === 'string' ? ref.localRel : null,
        assetRel: typeof ref.assetRel === 'string' ? ref.assetRel : null,
        assetKind: typeof ref.assetKind === 'string' ? ref.assetKind : null,
        remoteUrl: typeof ref.remoteUrl === 'string' ? ref.remoteUrl : null,
        nodeBuiltin: typeof ref.nodeBuiltin === 'string' ? ref.nodeBuiltin : null,
        resolution: ['local', 'asset', 'external', 'remote', 'browser-incompatible', 'unresolved'].includes(ref.resolution)
          ? ref.resolution
          : null,
        unresolvedReason: typeof ref.unresolvedReason === 'string' ? ref.unresolvedReason : null,
        bindings: Array.isArray(ref.bindings) ? ref.bindings.map((binding) => ({
          imported: typeof binding.imported === 'string' ? binding.imported : '',
          local: typeof binding.local === 'string' ? binding.local : '',
          kind: typeof binding.kind === 'string' ? binding.kind : '',
          inferred: Boolean(binding.inferred),
          typeOnly: Boolean(binding.typeOnly),
        })) : [],
      })) : [],
    }))
    .sort((a, b) => compareLocale(a.path, b.path));
}

function snapshotFromAnalysis(analysis, { gitCommit, generatedAt }) {
  const payload = {
    entry: analysis.entryRel,
    entryKind: analysis.entryKind || 'module',
    entryModules: Array.isArray(analysis.entryModules) ? analysis.entryModules : [analysis.entryRel].filter(Boolean),
    modules: analysisModulesPayload(analysis),
    treeText: analysis.treeText,
    jsxTreeText: analysis.jsxTreeText,
    jsScripts: analysis.jsScripts,
    jsxScripts: analysis.jsxScripts,
    mermaid: analysis.mermaid,
    importEdges: analysis.importEdges,
    components: Array.isArray(analysis.components) ? analysis.components : [],
    componentEdges: Array.isArray(analysis.componentEdges) ? analysis.componentEdges : [],
    routes: Array.isArray(analysis.routes) ? analysis.routes : [],
    lazyBoundaries: Array.isArray(analysis.lazyBoundaries) ? analysis.lazyBoundaries : [],
    assets: Array.isArray(analysis.assets) ? analysis.assets : [],
    browserApis: Array.isArray(analysis.browserApis) ? analysis.browserApis : [],
    remoteImports: Array.isArray(analysis.remoteImports) ? analysis.remoteImports : [],
    unresolvedImports: Array.isArray(analysis.unresolvedImports) ? analysis.unresolvedImports : [],
    browserIncompatibleImports: Array.isArray(analysis.browserIncompatibleImports) ? analysis.browserIncompatibleImports : [],
    findings: Array.isArray(analysis.findings) ? analysis.findings : [],
    functionMap: {
      limitations: Array.isArray(analysis.functionDependencyMap?.limitations)
        ? analysis.functionDependencyMap.limitations
        : [],
      functions: Array.isArray(analysis.functionDependencyMap?.functions)
        ? analysis.functionDependencyMap.functions
        : [],
      edges: Array.isArray(analysis.functionDependencyMap?.edges)
        ? analysis.functionDependencyMap.edges
        : [],
    },
    summary: analysis.summary,
  };
  return {
    ...payload,
    meta: {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      generatedAt,
      entry: analysis.entryRel,
      gitCommit,
      analysis: {
        analyzer: analysis.metadata?.analyzer || analysis.metadata?.backend || { name: 'javascript-ast' },
        backend: analysis.metadata?.backend || analysis.metadata?.analyzer || { name: 'javascript-ast' },
        framework: analysis.metadata?.framework || 'auto',
        includeUnreachable: Boolean(analysis.metadata?.includeUnreachable),
        moduleLimit: analysis.metadata?.moduleLimit || {
          limit: DEFAULT_MODULE_LIMIT,
          count: payload.modules.length,
        },
      },
      buildId: contentHash({
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
        gitCommit,
        ...payload,
      }),
    },
  };
}

async function loadSnapshotInput({
  folder = '.',
  input,
  entry,
  routeAliases = [],
  aliases = [],
  framework,
  sourceRoot = '',
  includeUnreachable = false,
  exclude = [],
  moduleLimit = DEFAULT_MODULE_LIMIT,
  generatedAt = new Date().toISOString(),
} = {}) {
  const effectiveModuleLimit = normalizeModuleLimit(moduleLimit);
  const snapshotPath = await snapshotPathForInput(input);
  if (snapshotPath) {
    return {
      label: safeSnapshotLabel(input, snapshotPath),
      snapshotPath,
      snapshot: await readJsonFile(snapshotPath),
    };
  }

  const projectRoot = external_node_path_namespaceObject.resolve(utils_normalizeString(folder).trim() || '.');
  const repoRoot = await gitTopLevel(projectRoot);
  const projectSubpath = external_node_path_namespaceObject.relative(repoRoot, projectRoot);
  const commit = await resolveGitCommit(projectRoot, input);
  if (!commit) {
    throw new diff_snapshots_SnapshotDiffError(`Unable to resolve diff input "${input}" as a snapshot path or git ref.`, 'input_not_found');
  }

  const materialized = await materializeGitCommit(repoRoot, commit);
  try {
    const materializedProjectRoot = external_node_path_namespaceObject.resolve(materialized.checkoutDir, projectSubpath);
    const analysis = await analyzeProject({
      rootDir: materializedProjectRoot,
      entry,
      routeAliases,
      aliases,
      framework,
      sourceRoot,
      includeUnreachable,
      exclude,
      moduleLimit: effectiveModuleLimit,
    });
    return {
      label: input,
      gitCommit: commit,
      snapshot: snapshotFromAnalysis(analysis, { gitCommit: commit, generatedAt }),
    };
  } finally {
    await materialized.cleanup();
  }
}

function normalizedFormat(format) {
  const value = utils_normalizeString(format || 'json').trim().toLowerCase();
  if (value !== 'json' && value !== 'html') {
    throw new diff_snapshots_SnapshotDiffError(`Unsupported diff format "${format}". Use json or html.`, 'unsupported_format');
  }
  return value;
}

function assertNoOutputCollision(outPath, sarifPath, { baselinePath, suppressionsPath } = {}) {
  const resolvedOutPath = outPath ? external_node_path_namespaceObject.resolve(outPath) : null;
  const resolvedSarifPath = sarifPath ? external_node_path_namespaceObject.resolve(sarifPath) : null;
  if (resolvedOutPath && resolvedSarifPath && resolvedOutPath === resolvedSarifPath) {
    throw new diff_snapshots_SnapshotDiffError('Diff --out and --sarif must not point to the same path.', 'output_collision');
  }

  const reportPaths = new Set([resolvedOutPath, resolvedSarifPath].filter(Boolean));
  const reviewInputPaths = [baselinePath, suppressionsPath]
    .filter(Boolean)
    .map((filePath) => external_node_path_namespaceObject.resolve(filePath));
  if (reviewInputPaths.some((filePath) => reportPaths.has(filePath))) {
    throw new diff_snapshots_SnapshotDiffError(
      'Diff review input and report output must not point to the same path.',
      'review_input_output_collision',
    );
  }
}

async function canonicalFilesystemIdentity(filePath) {
  if (!filePath) return null;
  const absolutePath = external_node_path_namespaceObject.resolve(filePath);
  let probePath = absolutePath;
  const missingSegments = [];

  while (true) {
    try {
      const canonicalBase = await promises_namespaceObject.realpath(probePath);
      const canonicalPath = external_node_path_namespaceObject.join(canonicalBase, ...missingSegments);
      let stats = null;
      try {
        stats = await promises_namespaceObject.stat(absolutePath);
      } catch (error) {
        if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR') throw error;
      }
      return {
        canonicalPath,
        device: stats?.dev ?? null,
        inode: stats?.ino ?? null,
      };
    } catch (error) {
      if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR') {
        throw new diff_snapshots_SnapshotDiffError(
          'Unable to inspect a diff review input or report output path.',
          'review_path_inspection_failed',
        );
      }
      const parentPath = external_node_path_namespaceObject.dirname(probePath);
      if (parentPath === probePath) {
        throw new diff_snapshots_SnapshotDiffError(
          'Unable to resolve a diff review input or report output path.',
          'review_path_inspection_failed',
        );
      }
      missingSegments.unshift(external_node_path_namespaceObject.basename(probePath));
      probePath = parentPath;
    }
  }
}

function sameFilesystemIdentity(left, right) {
  if (!left || !right) return false;
  if (left.canonicalPath === right.canonicalPath) return true;
  return left.device !== null
    && right.device !== null
    && left.device === right.device
    && left.inode === right.inode;
}

async function assertNoFilesystemOutputCollision(outPath, sarifPath, {
  baselinePath,
  suppressionsPath,
  snapshotPaths = [],
} = {}) {
  const [outIdentity, sarifIdentity, baselineIdentity, suppressionsIdentity, ...snapshotIdentities] = await Promise.all([
    canonicalFilesystemIdentity(outPath),
    canonicalFilesystemIdentity(sarifPath),
    canonicalFilesystemIdentity(baselinePath),
    canonicalFilesystemIdentity(suppressionsPath),
    ...snapshotPaths.map((snapshotPath) => canonicalFilesystemIdentity(snapshotPath)),
  ]);
  if (sameFilesystemIdentity(outIdentity, sarifIdentity)) {
    throw new diff_snapshots_SnapshotDiffError(
      'Diff --out and --sarif must not point to the same filesystem entry.',
      'output_alias_collision',
    );
  }
  const reportIdentities = [outIdentity, sarifIdentity].filter(Boolean);
  const reviewInputIdentities = [baselineIdentity, suppressionsIdentity].filter(Boolean);
  if (reviewInputIdentities.some((inputIdentity) => (
    reportIdentities.some((reportIdentity) => sameFilesystemIdentity(inputIdentity, reportIdentity))
  ))) {
    throw new diff_snapshots_SnapshotDiffError(
      'Diff review input and report output must not point to the same filesystem entry.',
      'review_input_output_alias',
    );
  }
  if (snapshotIdentities.filter(Boolean).some((inputIdentity) => (
    reportIdentities.some((reportIdentity) => sameFilesystemIdentity(inputIdentity, reportIdentity))
  ))) {
    throw new diff_snapshots_SnapshotDiffError(
      'Diff snapshot input and report output must not point to the same filesystem entry.',
      'snapshot_input_output_alias',
    );
  }
}

async function existingReportMode(resolvedPath) {
  try {
    const stats = await promises_namespaceObject.lstat(resolvedPath);
    if (!stats.isFile()) {
      throw new diff_snapshots_SnapshotDiffError(`Diff output "${resolvedPath}" must be a regular file.`, 'invalid_output');
    }
    return stats.mode & 0o7777;
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

async function stageTextFile(filePath, text) {
  const resolvedPath = external_node_path_namespaceObject.resolve(filePath);
  const directory = external_node_path_namespaceObject.dirname(resolvedPath);
  const tempPath = external_node_path_namespaceObject.join(directory, `.${external_node_path_namespaceObject.basename(resolvedPath)}.${process.pid}.${(0,external_node_crypto_namespaceObject.randomUUID)()}.tmp`);
  await promises_namespaceObject.mkdir(directory, { recursive: true });
  const existingMode = await existingReportMode(resolvedPath);
  try {
    await promises_namespaceObject.writeFile(tempPath, text, 'utf8');
    if (existingMode !== null) await promises_namespaceObject.chmod(tempPath, existingMode);
    return { resolvedPath, tempPath };
  } catch (error) {
    await promises_namespaceObject.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
}

async function restoreStagedReports(staged) {
  const rollbackErrors = [];
  for (const report of [...staged].reverse()) {
    try {
      if (report.committed) await promises_namespaceObject.rm(report.resolvedPath, { force: true });
      if (report.backupPath) await promises_namespaceObject.rename(report.backupPath, report.resolvedPath);
      await promises_namespaceObject.rm(report.tempPath, { force: true });
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  return rollbackErrors;
}

async function writeTextFiles(reports) {
  const staged = [];
  try {
    for (const report of reports) staged.push(await stageTextFile(report.filePath, report.text));
  } catch (error) {
    await Promise.all(staged.map((report) => promises_namespaceObject.rm(report.tempPath, { force: true }).catch(() => {})));
    throw error;
  }

  try {
    for (const report of staged) {
      const currentMode = await existingReportMode(report.resolvedPath);
      if (currentMode === null) continue;
      await promises_namespaceObject.chmod(report.tempPath, currentMode);
      report.backupPath = external_node_path_namespaceObject.join(
        external_node_path_namespaceObject.dirname(report.resolvedPath),
        `.${external_node_path_namespaceObject.basename(report.resolvedPath)}.${process.pid}.${(0,external_node_crypto_namespaceObject.randomUUID)()}.backup`,
      );
      await promises_namespaceObject.rename(report.resolvedPath, report.backupPath);
    }
    for (const report of staged) {
      await promises_namespaceObject.rename(report.tempPath, report.resolvedPath);
      report.committed = true;
    }
  } catch (error) {
    const rollbackErrors = await restoreStagedReports(staged);
    if (rollbackErrors.length > 0) {
      throw new AggregateError([error, ...rollbackErrors], 'Diff report transaction failed and could not be fully restored.');
    }
    throw error;
  }

  await Promise.all(staged.map((report) => (
    report.backupPath ? promises_namespaceObject.rm(report.backupPath, { force: true }) : Promise.resolve()
  )));
}

async function createArchitectureDiff({
  folder = '.',
  base,
  head,
  entry,
  routeAliases = [],
  aliases = [],
  framework,
  sourceRoot = '',
  includeUnreachable = false,
  exclude = [],
  format = 'json',
  outPath,
  sarifPath,
  baselinePath,
  suppressionsPath,
  failOn,
  moduleLimit = DEFAULT_MODULE_LIMIT,
  generatedAt = new Date().toISOString(),
} = {}) {
  const effectiveModuleLimit = normalizeModuleLimit(moduleLimit);
  if (!base) throw new diff_snapshots_SnapshotDiffError('ironglancer diff requires --base <input>.', 'missing_base');
  if (!head) throw new diff_snapshots_SnapshotDiffError('ironglancer diff requires --head <input>.', 'missing_head');
  const resolvedFormat = normalizedFormat(format);
  const effectiveOutPath = resolvedFormat === 'html' ? outPath || 'architecture-diff.html' : outPath;
  assertNoOutputCollision(effectiveOutPath, sarifPath, { baselinePath, suppressionsPath });
  await assertNoFilesystemOutputCollision(effectiveOutPath, sarifPath, { baselinePath, suppressionsPath });

  const [baselineReport, suppressionsConfig] = await Promise.all([
    baselinePath ? readReviewJsonFile(baselinePath, 'baseline report', 'baseline_read_failed') : null,
    suppressionsPath ? readReviewJsonFile(suppressionsPath, 'suppressions file', 'suppressions_read_failed') : null,
  ]);
  if (baselineReport) validateBaselineReport(baselineReport);
  if (suppressionsConfig) validateSuppressionsConfig(suppressionsConfig);

  const [baseInput, headInput] = await Promise.all([
    loadSnapshotInput({
      folder,
      input: base,
      entry,
      routeAliases,
      aliases,
      framework,
      sourceRoot,
      includeUnreachable,
      exclude,
      moduleLimit: effectiveModuleLimit,
      generatedAt,
    }),
    loadSnapshotInput({
      folder,
      input: head,
      entry,
      routeAliases,
      aliases,
      framework,
      sourceRoot,
      includeUnreachable,
      exclude,
      moduleLimit: effectiveModuleLimit,
      generatedAt,
    }),
  ]);
  await assertNoFilesystemOutputCollision(effectiveOutPath, sarifPath, {
    baselinePath,
    suppressionsPath,
    snapshotPaths: [baseInput.snapshotPath, headInput.snapshotPath].filter(Boolean),
  });
  const diff = compareSnapshots(baseInput.snapshot, headInput.snapshot, {
    baseLabel: baseInput.label,
    headLabel: headInput.label,
    generatedAt,
  });
  const reviewedDiff = applyReviewPolicy(diff, {
    baseline: baselineReport,
    suppressions: suppressionsConfig,
    failOn,
  });

  let stdoutText = null;
  let outputPath = null;
  const reports = [];
  if (resolvedFormat === 'json') {
    const json = JSON.stringify(reviewedDiff, null, 2) + '\n';
    if (effectiveOutPath) {
      reports.push({ filePath: effectiveOutPath, text: json });
      outputPath = external_node_path_namespaceObject.resolve(effectiveOutPath);
    } else {
      stdoutText = json;
    }
  } else {
    reports.push({ filePath: effectiveOutPath, text: renderDiffHtml(reviewedDiff) });
    outputPath = external_node_path_namespaceObject.resolve(effectiveOutPath);
  }

  let resolvedSarifPath = null;
  if (sarifPath) {
    reports.push({ filePath: sarifPath, text: JSON.stringify(renderDiffSarif(reviewedDiff), null, 2) + '\n' });
    resolvedSarifPath = external_node_path_namespaceObject.resolve(sarifPath);
  }
  if (reports.length > 0) await writeTextFiles(reports);

  return {
    diff: reviewedDiff,
    format: resolvedFormat,
    stdoutText,
    outputPath,
    sarifPath: resolvedSarifPath,
    exitCode: reviewedDiff.reviewPolicy?.gateTriggered ? 2 : 0,
  };
}

;// CONCATENATED MODULE: ./src/action.mjs





function envNameForInput(name) {
  return `INPUT_${name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`;
}

function getInput(name, { required = false } = {}) {
  const value = process.env[envNameForInput(name)] || '';
  const trimmed = value.trim();
  if (required && !trimmed) throw new Error(`Input "${name}" is required.`);
  return trimmed;
}

function parseList(value) {
  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function setOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    console.log(`${name}=${value}`);
    return;
  }
  const text = `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`;
  await promises_namespaceObject.appendFile(outputPath, text, 'utf8');
}

async function main() {
  const format = getInput('format') || 'json';
  const reportPath = getInput('report-path') || (format === 'html' ? 'architecture-diff.html' : 'architecture-diff.json');
  const sarifPath = getInput('sarif-path') || '';
  const result = await createArchitectureDiff({
    folder: getInput('folder') || '.',
    base: getInput('base', { required: true }),
    head: getInput('head', { required: true }),
    entry: getInput('entry') || undefined,
    framework: getInput('framework') || undefined,
    sourceRoot: getInput('source-root') || undefined,
    aliases: parseList(getInput('aliases') || getInput('alias')),
    routeAliases: parseList(getInput('route-aliases') || getInput('route-alias')),
    includeUnreachable: ['true', '1', 'yes'].includes(getInput('include-unreachable').toLowerCase()),
    exclude: parseList(getInput('exclude')),
    moduleLimit: getInput('module-limit') || undefined,
    baselinePath: getInput('baseline') || undefined,
    suppressionsPath: getInput('suppressions') || undefined,
    failOn: getInput('fail-on') || undefined,
    format,
    outPath: reportPath,
    sarifPath: sarifPath || undefined,
  });

  await setOutput('report-path', result.outputPath || external_node_path_namespaceObject.resolve(reportPath));
  await setOutput('sarif-path', result.sarifPath || '');
  await setOutput('gate-triggered', Boolean(result.diff.reviewPolicy?.gateTriggered));
  await setOutput('finding-count', Array.isArray(result.diff.findings) ? result.diff.findings.length : 0);
  await setOutput('exit-code', result.exitCode ?? 0);

  if (result.exitCode && result.exitCode !== 0) {
    console.error(`IronGlancer architecture diff gate failed with ${result.diff.reviewPolicy?.gateFindingIds?.length || 0} finding(s).`);
    process.exitCode = result.exitCode;
  }
}

main().catch((error) => {
  console.error(error?.message || String(error));
  process.exitCode = 1;
});
