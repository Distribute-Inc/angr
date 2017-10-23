import * as angular from 'angular'
import * as React from 'react'
import * as react2angular from 'react2angular'
import * as PropTypes from 'prop-types'

import './jipple-jop.scss'
// import './jipple-jop.html'
// import other stuff here

// these are the typescript proptypes, effectively
export interface JippleJopPropTypes {
  // write your interface here
}
// these props are used by react2angular and various other downstream consumers
export const propTypes = {
  // write your propTypes here, a la https://reactjs.org/docs/typechecking-with-proptypes.html
  // string: PropTypes.string,
  // requiredString: PropTypes.string.isRequired,
  // fn: PropTypes.func, // super irritating to remember this one
  // bool: PropTypes.bool,
  // obj: PropTypes.obj,
  // any: PropTypes.node,
  // aReactElement: PropTypes.element,
  // instanceOfX: PropTypes.instanceOf(X),
  // enumValue: PropTypes.oneOf([`a`, `b`, `c`]),
  // shapedObject: PropTypes.shape({color: PropTypes.string, fontFamily: PropTypes.string})
}

// this is our react component
export const JippleJop: React.StatelessComponent<JippleJopPropTypes> = (props: JippleJopPropTypes)=> {
  return (<div className="main-footer">
  <div className="main-footer-inner">
    <div className="main-footer-copyright-and-support-wrapper">
      <div className="main-footer-copyright-and-support">
        24/7 Support: (800) 378-1872<br />
        © DISTRIBUTE.COM 2017
      </div>
    </div>
    <div className="main-footer-image" />
    <div className="main-footer-links">
      <div className="main-footer-links-right">
        <a ui-sref="terms">Terms of Service</a>
        <a ui-sref="privacy-policy">Privacy Policy</a>
      </div>
    </div>
  </div>
</div>
)
}
// needs propTypes for react2angular to work
JippleJop.propTypes = propTypes

// let's export the angular nonsense
export const DistributeAngularJippleJop = angular.module(`distribute.components.jipple-jop`, [])
  .component(`jipple-jop`, react2angular(JippleJop))
