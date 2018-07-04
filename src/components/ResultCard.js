import React, {Component} from 'react'
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import { withStyles } from '@material-ui/core/styles';
import he from 'he'

const styles = theme => ({
  firstCard: {
    margin: '20px auto',
    [theme.breakpoints.down('sm')]: {
      width: '85%'
    },
    [theme.breakpoints.up('md')]: {
      width: '75%'
    },
    [theme.breakpoints.up('lg')]: {
      width:'50%',
      margin: '20px 25%'
    }
  },
  card : {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    margin: '50px auto',
    whiteSpace: 'pre-wrap',

    [theme.breakpoints.down('sm')]: {
      width: '60%'
    },
    [theme.breakpoints.up('md')]: {
      width: '40%'
    },
    [theme.breakpoints.up('lg')]: {
      width: '20%'
    }
  },
  attribute : {
    fontWeight: 'bold'
  },
  title: {
    fontWeight: 'bold'
  },
  description : {
  },
  bggLink : {
    textAlign: 'right',
    margin: 'auto 20px 0px 20px',
    position: 'relative',
    bottom: 10
  }
});

class ResultCard extends Component {
  state = {
    imgPadding: 40,
    textlength: 2000,
    textMultiplier: .4,
    expanded: false
  }

  componentWillMount () {
    this.updateTextLength();
  }

  //adjust image size to correct aspect ratio
  componentDidMount () {
    window.addEventListener('resize', this.updateTextLength);
    let imgPadding;
    const img = new Image();
    const thisCard = this;
    img.onload = function() {
      const height = img.height;
      const width = img.width;
      imgPadding = (height/width)*100 - 2
      thisCard.setState({imgPadding: imgPadding})
    };
    img.src = this.props.game.image._text;
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateTextLength);
  }

  updateTextLength = () => {
    //number of characters shown in description changes with window resize
    const width = window.innerWidth
    const textLength = Math.ceil(Math.pow((width/200),2))*80;
    let multiplier = .4
    if (width >= 1280) { multiplier = .06 }
    else if (width >= 960) {multiplier = .2}
    this.setState({textLength: textLength, multiplier: multiplier});
    }

  toggleExpanded = () => {
    const toggled = !this.state.expanded
    this.setState({expanded: toggled})
  }

  generateShortenedDescription () {
    const game = this.props.game;
    const fullDescription = he.decode(game.description._text)
    //descriptions are longer for the top match than other matches
    const stopIndex = this.props.rank === 1 ?
      this.state.textLength :
      Math.round(this.state.textLength*this.state.multiplier);
    console.log(stopIndex)
    //description always ends at the end of a sentence
    const endDescription = stopIndex + fullDescription.slice(stopIndex).search(/\.\s/) + 1
    const description = (endDescription === stopIndex) || this.state.expanded ?
      fullDescription :
      fullDescription.slice(0, endDescription)
    const addEllipse = endDescription !== stopIndex
    return {description: description, addEllipse: addEllipse};
  }

  generateGameInfo() {
    const game = this.props.game;
    const minPlayers = game.minplayers._attributes.value;
    const maxPlayers = game.maxplayers._attributes.value;
    const players = minPlayers === maxPlayers ? minPlayers : `${minPlayers} - ${maxPlayers}`

    const minTime = game.minplaytime._attributes.value;
    const maxTime =game.maxplaytime._attributes.value;
    const time = minTime === maxTime ? minTime : `${minTime} - ${maxTime}`


    const rating = Math.round(game.statistics.ratings.average._attributes.value*10)/10;
    const complexity = Math.round(game.statistics.ratings.averageweight._attributes.value*10)/10;
    const gameInfo = [
      {attribute: 'Players: ', value: players},
      {attribute: 'Time: ', value: `${time} minutes`},
      {attribute: 'BGG Rating: ', value: `${rating}/10`},
      {attribute: 'Complexity: ', value: `${complexity}/5`}
    ];

    return gameInfo
  }

  renderGameInfo (info) {
    const { classes } = this.props;
    const infoJSX = info.map((type,index) => {
      const key = `type-${index}`
      return (
        <p key={key}><span className = {classes.attribute}>{type.attribute}</span>{type.value}</p>
      )
    });
    return infoJSX;
  }

  render () {
    const game = this.props.game;
    const name = game.name[0] ?
      game.name[0]._attributes.value :
      game.name._attributes.value;
    const title = `${this.props.rank}. ${name} (${game.scores.score}% Match)`
    const {description, addEllipse} = this.generateShortenedDescription();

    const image = game.image._text;
    const link = `https://boardgamegeek.com/boardgame/${game._attributes.id}`
    const gameInfo = this.generateGameInfo();
    const { classes } = this.props;

    return (
        <Card
          raised = {true}
          className = {this.props.rank === 1 ? classes.firstCard : classes.card}>
          <CardMedia
          style ={{
            paddingTop:`${this.state.imgPadding}%`,
            marginBottom: this.props.rank === 1 || window.innerWidth < 960 ?
              '2%' : `${Math.max((100-2*this.state.imgPadding),2)}%`
          }}
          image = {image}
          title = {title}
          />
          <CardContent>
            <h3>{title}</h3>
            <hr />
            {this.renderGameInfo(gameInfo)}
            <hr />
            <p className = {classes.description}>{description}</p>
            {addEllipse &&
              <p
              style={{
                color: 'blue',
                fontWeight: 'bold',
                fontSize:this.state.expanded ? 16 : 24,
                cursor: 'pointer'}}
              onClick= {this.toggleExpanded}>
                {this.state.expanded ? 'collapse text' : '...'}
              </p>
            }
          </CardContent>
          <p className = {classes.bggLink}>
            <a href={link}>Read More on BoardGameGeek.com</a>
          </p>
        </Card>
    )
  }
}

export default withStyles(styles)(ResultCard);
