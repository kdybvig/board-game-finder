import React, {Component} from 'react';
import Radio from '@material-ui/core/Radio';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import uniqueId from 'lodash/uniqueId'

class RadioButtons extends Component {
  state = {
    selected: this.props.selection.toString()
  }

  handleChange = e => {
    this.props.changeSelection(this.props.title, this.props.option, e.target.value)
  }

  renderRadioButtons () {
    const colors = ['#C00', '#C60', '#CA0', '#8A4', '#080']
    return this.props.choices.map((choice,index) => {
      const val = this.props.weights[index].toString()
      const key = uniqueId('radio')
      return <Radio
        key = {key}
        index = {index}
        className = 'radio'
        checkedIcon={<RadioButtonCheckedIcon style={{ fill: colors[index]}} />}
        onChange={this.handleChange}
        checked={this.state.selected === val}
        value = {val}
      />
    })
  }

  render() {
    return (
      <div style={{gridRowStart:this.props.row}} className='grid'>
        {this.renderRadioButtons()}
      </div>
    )
  }
}

export default RadioButtons
