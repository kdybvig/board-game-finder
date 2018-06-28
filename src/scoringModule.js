export const findMatches = (selections, games) => {

  const dotProduct = (arr1, arr2) => arr1.reduce((acc, val, index) => acc + val*arr2[index], 0);

  const reduceScore = (selections, score, maxVal, minVal, maxSel, minSel) => {
    const maxScore = selections.reduce((acc,val) => {
      if(val < 0) return acc + val*minVal;
      return acc + val*maxVal;
    }, 0);
    const minScore = selections.reduce((acc,val) => {
      if(val < 0) return acc + val*maxVal;
      return acc + val*minVal;
    }, 0);
    const absoluteMax = Math.max(maxSel*maxVal*selections.length, minSel*minVal*selections.length);
    const absoluteMin = Math.min(maxSel*minVal*selections.length, minSel*maxVal*selections.length);
    const percentMatch = maxScore - minScore === 0 ? 50: (score-minScore)/(maxScore-minScore)*100;
    const absoluteMatch = (score - absoluteMin)/(absoluteMax-absoluteMin)*100;
    const reducedScore = (percentMatch + absoluteMatch)/2;
    return reducedScore
  }

  const scorePlayer = (pollArr) => {
    const best = Number(pollArr[0]._attributes.numvotes);
    const recommended = Number(pollArr[1]._attributes.numvotes);
    const notRecommended = Number(pollArr[2]._attributes.numvotes);
    const score = (2*best + recommended - notRecommended)/(best + recommended + notRecommended);
    return score;
  }

  const scorePlayerOptions = (pollResults) => {
    const allScores = pollResults.map(poll => scorePlayer(poll.result));
    //fill in worst possible score if there is no option for a given # of players
    while (allScores.length < 4) allScores.push(-1);
    //the scores for 1-4 players
    const scores = allScores.slice(0,4);
    //score for > 4 players is max of any poll result for more than four players
    const moreThanFour = allScores.length > 4 ? Math.max(...allScores.slice(4)): -1;
    scores.push(moreThanFour);
    return scores;
  }

  const findPlayersScore = (selections,poll) => {
    const validPoll = poll._attributes.name === "suggested_numplayers";
    if (validPoll) {
      const scores = scorePlayerOptions(poll.results);
      const score = dotProduct(selections, scores);
      //score reduced to between 0 and 1
      return reduceScore(selections, score, 2, -1, 8, 0);
    }
    else {
      console.log('ERROR - Invalid Poll');
      return -1;
    }
  }

  const scoreTimeOptions = (time) => {
    const timeScores = [0,0,0]
    if (time < 60) {
      timeScores[0] = 1
    }
    else if (time <= 120) {
      timeScores[1] = 1
    }
    else {
      timeScores[2] = 1
    }
    return timeScores
  }

  const findTimeScore = (selections, time) => {
    const scores = scoreTimeOptions(time);
    const score = dotProduct(selections, scores);
    const absoluteMax = 2;
    //absolute min is artificially high to allow negative scores for hated time lengths
    const absoluteMin = -3;
    const maxScore = Math.max(...selections)
    const minScore = Math.min(...selections)
    const percentMatch = (maxScore - minScore) === 0 ? 50: (score-minScore)/(maxScore-minScore)*100
    const absoluteMatch = (score - absoluteMin)/(absoluteMax-absoluteMin)*100
    const reducedScore = (percentMatch + absoluteMatch)/2
    return reducedScore
  }

  const scoreTypeOptions = (names, type) => {
    const catArr = ['ScienceFiction', 'Fantasy', 'Horror', 'Fighting', 'Economic'];
    const mechArr = ['Co-operative Play', 'Worker Placement', 'Card Drafting', 'Dice Rolling', 'Hand Management', 'Area Control / Area Influence'];
    const optionsArr = type === 'boardgamecategory' ? catArr : mechArr
    const scores = new Array(optionsArr.length).fill(0)
    optionsArr.forEach((option, index) => {
      if(names.indexOf(option) > -1) scores[index] = 1;
    })
    return scores;
  }

  const findTypeScore = (selections, links, type) => {
    const names = links.filter(link => link._attributes.type === type)
    .map(link => link._attributes.value);
    const scores = scoreTypeOptions(names, type);
    const score = dotProduct(selections,scores);
    //minSel is artificially high in order to give negative scores for hated types
    return reduceScore(selections, score, 1, 0, 2, -4);
  }

  const scoreComplexityOptions = (weight) => {
    const scores = new Array(4).fill(0)
    if (weight < 1.9) {
      scores[0] = 5;
    }
    else if (weight < 2.3) {
      scores[1] = Math.round(5 - (2.3-weight)*10)
      scores[0] = Math.round((2.3-weight)*10)
    }
    else if (weight < 2.8) {
      scores[1] = 5;
    }
    else if (weight < 3.2) {
      scores[2] = Math.round(5 - (3.2-weight)*10)
      scores[1] = Math.round((3.2-weight)*10)
    }
    else if (weight < 3.7) {
      scores[2] = 5;
    }
    else if (weight < 4.1) {
      scores[3] = Math.round(5 - (4.1-weight)*10)
      scores[2] = Math.round((4.1-weight)*10)
    }
    else {
      scores[3] = 5;
    }
    return scores;
  }
  const findComplexityScore = (selections, weight) => {
    weight = Math.round(Number(weight)*10)/10;
    const scores = scoreComplexityOptions(weight);
    const score = dotProduct(selections, scores);
    const absoluteMax = 10;
    const absoluteMin = -20;
    const maxScore = Math.max(...selections)*5;
    const minScore = Math.min(...selections)*5;
    const percentMatch = (maxScore - minScore) === 0 ? 50: (score-minScore)/(maxScore-minScore)*100;
    const absoluteMatch = (score - absoluteMin)/(absoluteMax-absoluteMin)*100;
    const reducedScore = (percentMatch + absoluteMatch)/2;
    return reducedScore;

  }

  const gamesWithScores = games.map(game => {
      const playersScore = findPlayersScore(selections.players, game.poll[0]);
      const timeScore = findTimeScore(selections.time, Number(game.playingtime._attributes.value));
      const categoryScore = findTypeScore(selections.categories, game.link, 'boardgamecategory');
      const mechanicScore = findTypeScore(selections.mechanics, game.link, 'boardgamemechanic')
      const weight = game.statistics.ratings.averageweight._attributes.value;
      const complexityScore = findComplexityScore(selections.complexity, weight);
      const ratingScore = Number(game.statistics.ratings.average._attributes.value)*10
      //overall score uses a curving formula to yield higher match percentages
      const overallScore = Math.round(100 - Math.pow((100 -(
        1.5*playersScore +
        1.5*timeScore +
        2*categoryScore +
        2.5*mechanicScore +
        1.5*complexityScore +
        ratingScore
      )/10),1.5)/10)
      game.scores = {
        score: overallScore,
        players: playersScore,
        time: timeScore,
        category: categoryScore,
        mechanic: mechanicScore,
        complexity: complexityScore
      }
      return game
    }
  )

  const topFiveMatches = gamesWithScores.sort((game1,game2) => {
    const scoreDiff = game2.scores.score - game1.scores.score
    return scoreDiff ? scoreDiff : game2.scores.percentMatch - game1.scores.percentMatch
  }).slice(0,5)


  return topFiveMatches;
}
