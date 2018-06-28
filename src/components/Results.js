import React from 'react'
import uniqueId from 'lodash/uniqueId'
import ResultCard from './ResultCard'

const Results = (props) => {
  const renderMatches = () => {
    const cards = props.matches.map((game, index) => {
      const key = uniqueId('game')
      return (
        <ResultCard
        key={key}
        rank = {index + 1}
        game={game}/>
      )
    });
    return cards;
  }

  return (
    <div>
      <h1>Top Matches</h1>
      <div className = 'results'>
        {renderMatches()}
      </div>
      <div style={{textAlign: 'center'}}>
        <input type='submit' style = {{margin: '25px 0 50px 0', fontSize: 36, minHeight: 64, padding: '5px 25px', backgroundColor: '#6A94C3', borderColor: '#6A94C3', fontWeight: 'bold'}} value ='Retake Quiz' onClick={props.retakeQuiz}/>
      </div>
    </div>
  )
}

export default Results;
