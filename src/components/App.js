import React, { Component } from 'react';
import '../App.css';
import convert from 'xml-js'
import Question from './Question'
import Results from './Results'
import {findMatches} from '../scoringModule'

export default class App extends Component {
    constructor(props) {
      super(props)
      this.state = {
          games: [],
          selections: {},
          matches: [],
          isLoaded: false,
          showMatches: false,
          curQuestion: 0,
          error: ''
      };
      this.choices = {
        frequency: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often'],
        preference: ['Hate', 'Dislike', 'Meh', 'Like', 'Love']
      };

      this.questions = [
        {
          prompt:'How often do you play games with...' ,
          title: 'Players',
          weights: [0,1,2,4,8],
          choices: this.choices.frequency,
          options: ['One Player', 'Two Players', 'Three Players', 'Four Players', 'More Than Four Players']
        },
        {
          prompt:'How do you feel about games that last...' ,
          title: 'Time',
          weights: [-6,-3,-1,1,2],
          choices: this.choices.preference,
          options: ['Less than an hour', 'One to two hours', 'More than two hours']
        },
        {
          prompt: 'Rate your preference for each of the following game categories:',
          title: 'Categories',
          weights: [-10,-5,-1,1,2],
          choices: this.choices.preference,
          options: ['Science Fiction', 'Fantasy', 'Horror', 'Combat', 'Resource Management']
        },
        {
          prompt:'Rate your preference for each of the following game mechanics:' ,
          title: 'Mechanics',
          weights: [-10,-5,-1,1,2],
          choices: this.choices.preference,
          options: ['Cooperative Play', 'Worker Placement', 'Card Drafting', 'Dice Rolling', 'Hand Management', 'Area Control']
        },
        {
          prompt: 'What is your opinion of games that are...',
          title: 'Complexity',
          weights: [-10,-5,-1,1,2],
          choices: this.choices.preference,
          options: ['Relatively Simple', 'A little Complex', 'Somewhat Complex', 'Very Complex']
        }
      ]
    }

    componentWillMount() {
      const defaultSelections = this.getDefaultSelections();
      this.setState({selections: defaultSelections})
    }

    componentDidMount() {
      const handleErrors = (response) => {
        if(!response.ok) throw Error (`Request rejected with status of ${response.status}`)
        return response.text()
      }
      fetch("https://www.boardgamegeek.com/xmlapi2/hot")
      .then(response => handleErrors(response))
      .then(str => {
        const result = convert.xml2json(str, {compact: true, spaces: 4});
        const resultObj = JSON.parse(result);
        const hotGames = resultObj.items.item;
        const hotIDs = hotGames.map(game => game._attributes.id);
        const hotIDstring = hotIDs.join(',');
        const baseUrl = "https://www.boardgamegeek.com/xmlapi2/thing?marketplace=1&stats=1&id=";
        fetch(baseUrl + hotIDstring)
        .then(response => handleErrors(response))
        .then(str2 => {
          const result2 = convert.xml2json(str2, {compact: true, spaces: 4});
          const hotGames = JSON.parse(result2).items.item;
          //filter out games that have too little information to rate effectively
          const filteredGames = hotGames.filter(game => Number(game.poll[0]._attributes.totalvotes) > 20);
          const matches = this.state.showMatches ?
            findMatches(this.state.selections,this.state.games) :
            [];
          this.setState({games: filteredGames, isLoaded: true, matches: matches})
        })
      })
      .catch(error => this.setState({isLoaded: true, showMatches: true, error: error}))
    }

    getDefaultSelections = () => {
      const defaultSelections = {}
      this.questions.forEach(question => {
        question.options.forEach((option, index) => {
          const title = question.title.toLowerCase();
          if(!defaultSelections[title]) defaultSelections[title] = [];
          //defaults to selecting middle radio button
          defaultSelections[title][index] = question.weights[2];
          })
        })

        return defaultSelections
    }

    //handler for radio button clicks
    changeSelection = (title, index, value) => {
      title = title.toLowerCase();
      const newSelections = Object.assign(this.state.selections);
      if(!newSelections[title]) newSelections[title] = [];
      newSelections[title][index] = Number(value);
      this.setState({selections: newSelections})
    }

    //handler for next question input clicks
    nextQuestion = () => {
      const nextQuestion = this.state.curQuestion + 1
      this.setState({curQuestion: nextQuestion})
    }

    //handler for find matches input clicks
    showMatches = () => {
      const matches = this.state.isLoaded ?
        //findMatches is imported from scoringModule
        findMatches(this.state.selections,this.state.games) :
        [];
      this.setState({matches: matches, showMatches: true})
    }

    retakeQuiz = () => {
      const defaultSelections = this.getDefaultSelections();

      this.setState({
        selections: defaultSelections,
        matches: [],
        showMatches: false,
        curQuestion: 0
      })
    }

    render(){
      const backgroundUrl = this.state.matches.length ?
        './background2.jpg' : './background1.jpg';
      document.body.style.backgroundImage = `url(${backgroundUrl})`;
      const question = this.questions[this.state.curQuestion]
      return (
        <div>
          {!this.state.showMatches &&
            <div>
              <h1>Which board game should I buy?</h1>
              <Question
                selections={this.state.selections[question.title.toLowerCase()]}
                weights = {question.weights}
                changeSelection = {this.changeSelection}
                title = {question.title}
                prompt = {question.prompt}
                choices = {question.choices}
                options = {question.options}
                inputClick = {
                  this.state.curQuestion < this.questions.length - 1 ?
                  this.nextQuestion:
                  this.showMatches
                }
                inputValue = {
                  this.state.curQuestion < this.questions.length - 1 ?
                  'Next Question' :
                  'Find Matches'
                }/>
              <p style={{textAlign: 'center'}}>Website created using data from <a href="http://boardgamegeek.com">BoardGameGeek.com</a></p>
            </div>
          }
          {this.state.showMatches && !this.state.isLoaded &&
          <p>loading...</p>}

          {!!this.state.matches.length &&
            <Results matches = {this.state.matches} retakeQuiz = {this.retakeQuiz}/>
          }

          {this.state.error &&
            <h1 style = {{fontFamily: 'sans-serif'}}>{this.state.error.toString()}</h1>
          }
        </div>
      )
    }
}
