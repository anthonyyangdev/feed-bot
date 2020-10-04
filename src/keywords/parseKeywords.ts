
const isQuoted = (s: string) => s.startsWith('"') && s.endsWith('"');

/**
 * Parses the input content into its keyword arguments, i.e. the arguments after the
 * command substring.
 * @param msg_content: A trimmed string.
 * @param command: A substring that [msg_content] starts with.
 */
export const parseKeywords = (msg_content: string, command: string): string[] => {
  /*
   Regex found from here:
   https://stackoverflow.com/questions/366202/regex-for-splitting-a-string-using-space-when-not-surrounded-by-single-or-double
   */
  const keywords = msg_content
    .substring(command.length + 1)
    .match(/[^\s"']+|"([^"]*)"|'([^']*)'/g)
    ?.map(s => isQuoted(s) ? s.substring(1, s.length - 1) : s);
  return keywords?.filter(s => s.length > 0) ?? [];
};
