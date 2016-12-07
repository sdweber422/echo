import React, {Component} from 'react'

import Iframe from 'src/common/components/Iframe'

export class Profile extends Component {
  render() {
    return <Iframe url={`${process.env.IDM_BASE_URL}/profile`} height="650px"/>
  }
}

export default Profile
