
import { LinkItem, Actor, Tag } from '../types';

export interface SearchResult<T> {
  item: T;
  score: number;
}

/**
 * Normalizes strings by removing accents, special characters, and extra whitespace.
 */
const normalize = (str: string) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Improved fuzzy score logic with higher weights for exact inclusion.
 */
const getFuzzyScore = (target: string, query: string): number => {
  const t = normalize(target);
  const q = normalize(query);

  if (!q) return 1.0;
  if (t === q) return 2.0; // Boost exact matches significantly
  if (t.startsWith(q)) return 1.5;
  if (t.includes(q)) return 1.2;

  // Split into words for partial matching
  const targetWords = t.split(' ');
  const queryWords = q.split(' ');
  
  let matchCount = 0;
  for (const qw of queryWords) {
    if (qw.length < 2) continue;
    if (targetWords.some(tw => tw.startsWith(qw) || tw.includes(qw))) {
      matchCount++;
    }
  }

  // Calculate Jaccard-like similarity for fuzzy resilience
  return (matchCount / queryWords.length);
};

export const filterLinks = (
  links: LinkItem[],
  query: string,
  actorMap: Map<string, Actor>,
  tagMap: Map<string, Tag>,
  contextId?: string // Optional context (Actor/Tag ID) to prioritize
): LinkItem[] => {
  if (!query.trim()) return links;

  const results: SearchResult<LinkItem>[] = links.map(link => {
    // If we are in a Vault, and the link belongs to that vault, it gets a baseline score
    const isContextMatch = contextId && (link.actorIds.includes(contextId) || link.tagIds.includes(contextId));
    const baseline = isContextMatch ? 0.5 : 0;

    const linkActors = link.actorIds.map(id => actorMap.get(id)).filter((a): a is Actor => !!a);
    const linkTags = (link.tagIds || []).map(id => tagMap.get(id)).filter((t): t is Tag => !!t);

    // Calculate scores for fields
    const titleScore = getFuzzyScore(link.title, query) * 1.5;
    
    const actorScore = linkActors.reduce((acc, actor) => {
      return Math.max(acc, getFuzzyScore(actor.name, query));
    }, 0) * 1.3;

    const tagScore = linkTags.reduce((acc, tag) => {
      return Math.max(acc, getFuzzyScore(tag.name, query));
    }, 0) * 1.1;

    const urlScore = Math.max(
      getFuzzyScore(link.urlHD || '', query),
      getFuzzyScore(link.url4K || '', query)
    ) * 0.4;

    return {
      item: link,
      score: Math.max(baseline, titleScore, actorScore, tagScore, urlScore)
    };
  });

  return results
    .filter(r => r.score > 0.4) // Strict threshold to maintain quality
    .sort((a, b) => b.score - a.score)
    .map(r => r.item);
};
