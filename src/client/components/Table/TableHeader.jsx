/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    4/3/19 1:22 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

class TableHeader extends React.Component {
  render () {
    const { width, height, padding, textAlign, text, component, onSort, sortDirection } = this.props

    return (
      <th
        aria-sort={onSort ? sortDirection || 'none' : undefined}
        style={{
          width: width,
          padding: padding,
          height: height,
          verticalAlign: 'middle',
          fontSize: 12,
          textTransform: 'uppercase',
          textAlign: textAlign
        }}
      >
        {component}
        {onSort ? (
          <button
            type='button'
            onClick={onSort}
            aria-label={`${text}: sort ${sortDirection === 'ascending' ? 'descending' : 'ascending'}`}
            style={{
              background: 'none',
              border: 0,
              padding: 0,
              color: 'inherit',
              font: 'inherit',
              textTransform: 'inherit',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {text}
            <span aria-hidden='true' style={{ display: 'inline-flex', flexDirection: 'column', fontSize: 9, lineHeight: 1 }}>
              <span style={{ opacity: sortDirection === 'ascending' ? 1 : 0.35 }}>▲</span>
              <span style={{ opacity: sortDirection === 'descending' ? 1 : 0.35 }}>▼</span>
            </span>
          </button>
        ) : (
          text
        )}
      </th>
    )
  }
}

TableHeader.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  padding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  textAlign: PropTypes.string,
  text: PropTypes.string,
  onSort: PropTypes.func,
  sortDirection: PropTypes.oneOf(['ascending', 'descending']),
  component: PropTypes.oneOfType([PropTypes.element, PropTypes.func])
}

TableHeader.defaultProps = {
  textAlign: 'left'
}

export default TableHeader
