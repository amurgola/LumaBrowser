class ConvexScoreFusion {
  static DENSE_WEIGHT = 0.6;

  static blend(lexical, dense, denseWeight = ConvexScoreFusion.DENSE_WEIGHT) {
    const weight = dense && dense.size ? denseWeight : 0;
    return ConvexScoreFusion._ids(lexical, dense)
      .map((id) => ({ id, relevance: ConvexScoreFusion._relevance(id, lexical, dense, weight) }))
      .sort((a, b) => b.relevance - a.relevance);
  }

  static _ids(lexical, dense) {
    return [...new Set([...(lexical ? lexical.keys() : []), ...(dense ? dense.keys() : [])])];
  }

  static _relevance(id, lexical, dense, weight) {
    const lexicalPart = (lexical && lexical.get(id)) || 0;
    const densePart = (dense && dense.get(id)) || 0;
    return (1 - weight) * lexicalPart + weight * densePart;
  }
}

module.exports = ConvexScoreFusion;
