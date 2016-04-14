import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {Button} from 'react-toolbox/lib/button'
import {CardTitle, CardText} from 'react-toolbox/lib/card'
import ProgressBar from 'react-toolbox/lib/progress_bar'
import Table from 'react-toolbox/lib/table'

import loadChapters from '../actions/loadChapters'

const ChapterModel = {
  name: {type: String},
  timezone: {type: String},
  cycleDuration: {type: String},
}

class ChapterList extends Component {
  constructor(props) {
    super(props)
    this.handleCreateChapter = this.handleCreateChapter.bind(this)
    this.handleEditChapter = this.handleEditChapter.bind(this)
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
  }

  static fetchData(dispatch) {
    dispatch(loadChapters())
  }

  handleCreateChapter() {
    this.props.dispatch(push('/chapters/new'))
  }

  handleEditChapter(row) {
    this.props.dispatch(push(`/chapters/${this.chapterList()[row].id}`))
  }

  chapterList() {
    const {chapters} = this.props.chapters
    return Object.keys(chapters)
      .map(chapterId => chapters[chapterId])
      .sort((a, b) => {
        if (a.name > b.name) {
          return -1
        } else if (a.name === b.name) {
          return 0
        }
        return 1
      })
  }

  render() {
    if (this.props.chapters.isBusy) {
      return <ProgressBar/>
    }

    const chapterList = this.chapterList()
    const content = chapterList.length > 0 ? (
      <Table
        selectable
        model={ChapterModel}
        source={chapterList}
        onSelect={this.handleEditChapter}
        />
    ) : (
      <CardText>No chapters yet.</CardText>
    )

    return (
      <div>
        <CardTitle title="Chapters"/>
        {content}
        <Button icon="add" floating accent onClick={this.handleCreateChapter} style={{float: 'right'}}/>
      </div>
    )
  }
}

ChapterList.propTypes = {
  chapters: PropTypes.shape({
    isBusy: PropTypes.bool.isRequired,
    chapters: PropTypes.object.isRequired,
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  return {
    auth: state.auth,
    chapters: state.chapters,
  }
}

export default connect(mapStateToProps)(ChapterList)
