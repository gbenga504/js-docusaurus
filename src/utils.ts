export const getFunctionNameRegex: string =
  '(?<![`\'"].*)((?<=export\\s+(default)?\\s*function\\s+)[\\w_$]+(?=\\(.*)|(?<=export\\s+.+)[\\w_$]+(?=\\s*=\\s*(\\{|\\(.*)))';

export const CommentLineRegex: string = '^s*//.*';

// getCommentNameRegex returns a regular expression that checks
// that a comment starts with the function name
export const getCommentNameRegex = (functionName: string): string => {
  return `^\s*\/\/\\s*${functionName}\\s+.*`;
};