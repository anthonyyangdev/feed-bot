
const isQuoted = (s: string) => s.startsWith('"') && s.endsWith('"');

export const parseKeywords = (msg_content: string, command: string): string[] => {
  const keywords = msg_content
    .substring(command.length + 1)
    .match(/[^\s"']+|"([^"]*)"|'([^']*)'/g)
    ?.map(s => isQuoted(s) ? s.substring(1, s.length - 1) : s);
  return keywords?.filter(s => s.length > 0) ?? [];
};
