/**
 * Rule-based AI Event Recommendation Engine
 * Analyzes student interests, academic department, historical engagement, and event popularity
 * to compute a personalized match score and explanation for each event.
 */
export const getAIRecommendedEvents = (user, events) => {
  if (!events || events.length === 0) return [];

  const userInterests = (user?.interests || []).map((i) => i.toLowerCase().trim());
  const userDept = (user?.department || '').toLowerCase().trim();

  const scoredEvents = events.map((event) => {
    let score = 0;
    const reasons = [];

    const eventTitle = (event.title || '').toLowerCase();
    const eventCategory = (event.category || '').toLowerCase();
    const eventDesc = (event.description || '').toLowerCase();
    const eventTags = (event.tags || []).map((t) => t.toLowerCase());

    // 1. Direct Category Match (+35 points)
    const matchedCategory = userInterests.find(
      (interest) => interest === eventCategory || eventCategory.includes(interest) || interest.includes(eventCategory)
    );
    if (matchedCategory) {
      score += 35;
      reasons.push(`Matches your interest in ${event.category}`);
    }

    // 2. Tag Matching (+15 points per matched tag, max 45)
    let tagMatches = 0;
    for (const interest of userInterests) {
      for (const tag of eventTags) {
        if (tag.includes(interest) || interest.includes(tag)) {
          tagMatches++;
          score += 15;
          if (reasons.length < 2) {
            reasons.push(`Related to ${tag}`);
          }
          break;
        }
      }
      if (tagMatches >= 3) break;
    }

    // 3. Keyword matching in Title / Description (+10 points)
    for (const interest of userInterests) {
      if (eventTitle.includes(interest)) {
        score += 10;
        break;
      }
    }

    // 4. Department Relevance (+15 points)
    if (userDept && (eventDesc.includes(userDept) || (event.eligibility && event.eligibility.toLowerCase().includes(userDept)))) {
      score += 15;
      reasons.push(`Curated for ${user.department}`);
    }

    // 5. Popularity & Engagement Boost (up to +20 points)
    const capacityRatio = event.maxCapacity > 0 ? (event.registeredCount || 0) / event.maxCapacity : 0;
    if (capacityRatio > 0.6) {
      score += 12;
      if (reasons.length === 0) reasons.push('Trending on campus');
    }
    if (event.featured) {
      score += 8;
    }

    // Base score so every event has a positive ranking
    score += 10;

    // Normalization to 0-99% match
    const matchPercentage = Math.min(98, Math.max(45, Math.round((score / 120) * 100)));

    const primaryReason = reasons[0] || 'Recommended based on campus activity';

    return {
      event,
      matchScore: score,
      matchPercentage,
      recommendationReason: primaryReason,
    };
  });

  // Sort descending by match score
  scoredEvents.sort((a, b) => b.matchScore - a.matchScore);

  return scoredEvents;
};
