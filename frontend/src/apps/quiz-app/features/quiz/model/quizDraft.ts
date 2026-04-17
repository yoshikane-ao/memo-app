export const parseQuizTags = (value: string) => {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const rawTag of value.split(/[\n,、]/)) {
    const normalizedTag = rawTag.trim();
    if (normalizedTag === "" || seen.has(normalizedTag)) {
      continue;
    }

    seen.add(normalizedTag);
    tags.push(normalizedTag);
  }

  return tags;
};
