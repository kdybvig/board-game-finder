import React from 'react';
import uniqueId from 'lodash/uniqueId'
import RadioButtons from './RadioButtons'

const Question = (props) => {
  const renderChoices = (choices) => {
    return choices.map(choice => {
        const key = uniqueId('choice');
        return <p key={key}>{choice}</p>
      })
  }

  const renderOptions = (options) => {
    return options.map(option => {
        const key = uniqueId('option');
        return <p key={key}>{option}</p>
      })
  }

  const  renderRadioButtons = (options) => {
    return options.map((options,index) => {
      const key = uniqueId('buttons');
      return (
        <RadioButtons
          key={key}
          row={5 + index}
          weights={props.weights}
          choices={props.choices}
          title={props.title}
          option={index}
          selection = {props.selections ? props.selections[index] : props.weights[2]}
          changeSelection = {props.changeSelection}/>
      )
    })
  }

  return (
    <div className='box'>
      <h2>{props.title}</h2>
      <h4 className='prompt'>{props.prompt}</h4>
      <div style={{gridRowStart:4}} className='grid'>
        {renderChoices(props.choices)}
      </div>
      {renderRadioButtons(props.options)}
      <div className='options'>
        {renderOptions(props.options)}
      </div>
      <input
        style = {{gridRowStart: 5 + props.options.length, gridColumnStart: 2}}
        className='next'
        type='submit'
        value={props.inputValue}
        onClick={props.inputClick}/>
    </div>
  )
}

export default Question;
