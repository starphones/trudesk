/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    5/18/19 1:19 AM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { each } from 'lodash'
import { connect } from 'react-redux'
import { hideModal } from 'actions/common'
import { fetchGroups, unloadGroups } from 'actions/groups'
import { getTagsWithPage, fetchTicketTypes, fetchTicketStatus } from 'actions/tickets'

import BaseModal from 'containers/Modals/BaseModal'
import SingleSelect from 'components/SingleSelect'
import Button from 'components/Button'
import api from 'api'

import helpers from 'lib/helpers'

const AU_STATE_VALUES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']

class FilterTicketsModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      allStaffs: [],
      staffs: []
    }

    this.onTicketStateFilterChanged = this.onTicketStateFilterChanged.bind(this)
    this.updateStaffOptions = this.updateStaffOptions.bind(this)
  }

  componentDidMount () {
    helpers.UI.inputs()
    this.props.fetchGroups()
    this.props.getTagsWithPage({ limit: -1 })
    this.props.fetchTicketTypes()
    this.props.fetchTicketStatus()
    api.tickets
      .fetchStaffs()
      .then(res => {
        const staffs = res && res.staffs ? res.staffs : []
        this.setState({ allStaffs: staffs, staffs: staffs })
      })
      .catch(() => {
        this.setState({ allStaffs: [], staffs: [] })
      })
  }

  componentDidUpdate () {
    helpers.UI.reRenderInputs()
  }

  componentWillUnmount () {
    this.props.unloadGroups()
  }

  onTicketStateFilterChanged (e, values) {
    const selectedStates = Array.isArray(values) ? values : values ? [values] : []
    this.updateStaffOptions(selectedStates)
  }

  updateStaffOptions (selectedStates) {
    if (!selectedStates || selectedStates.length === 0) {
      this.setState({ staffs: this.state.allStaffs })
      return
    }

    const normalizedStates = selectedStates.map(s => String(s).toLowerCase().trim())
    const staffs = this.state.allStaffs.filter(staff => normalizedStates.includes(String(staff.state || '').toLowerCase().trim()))

    this.setState({ staffs: staffs })
  }

  onSubmit (e) {
    e.preventDefault()
    const startDate = e.target.filterDate_Start.value
    const endDate = e.target.filterDate_End.value
    const statuses = this.statusSelect.value
    const tags = this.tagsSelect.value
    const types = this.typesSelect.value
    const ticketStates = this.ticketStateSelect.value
    const staffnames = (this.staffSelect && this.staffSelect.value) || []
    const staffnameOptions = this.state.staffs.map(s => s.staffname)
    const selectedStaffnames = (Array.isArray(staffnames) ? staffnames : [staffnames]).filter(s =>
      staffnameOptions.includes(s)
    )

    let queryString = '?f=1'
    if (startDate) queryString += `&ds=${startDate}`
    if (endDate) queryString += `&de=${endDate}`

    each(statuses, i => {
      queryString += `&st=${i}`
    })

    each(types, i => {
      queryString += `&tt=${i}`
    })

    each(tags, i => {
      queryString += `&tag=${i}`
    })

    each(ticketStates, i => {
      queryString += `&ts=${i}`
    })

    each(selectedStaffnames, i => {
      queryString += `&sn=${encodeURIComponent(i)}`
    })

    History.pushState(null, null, `/tickets/filter/${queryString}&r=${Math.floor(Math.random() * (99999 - 1 + 1)) + 1}`)
    this.props.hideModal()
  }

  render () {
    const statuses = this.props.ticketStatuses.map(s => ({ text: s.get('name'), value: s.get('_id') })).toArray()

    const tags = this.props.ticketTags
      .map(t => {
        return { text: t.get('name'), value: t.get('_id') }
      })
      .toArray()

    const types = this.props.ticketTypes
      .map(t => {
        return { text: t.get('name'), value: t.get('_id') }
      })
      .toArray()

    const ticketStates = AU_STATE_VALUES.map(state => ({ text: state, value: state }))
    const staffs = this.state.staffs.map(staff => ({ text: staff.staffname, value: staff.staffname }))

    return (
      <BaseModal options={{ bgclose: false }}>
        <h2 style={{ marginBottom: 20 }}>Ticket Filter</h2>
        <form className={'uk-form-stacked'} onSubmit={e => this.onSubmit(e)}>
          <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
            <div className='uk-width-1-2' style={{ padding: '0 15px 0 0' }}>
              <label htmlFor='filterDate_Start' className='uk-form-label nopadding nomargin'>
                Date Start
              </label>
              <input
                id='filterDate_Start'
                className='md-input'
                name='filterDate_Start'
                type='text'
                data-uk-datepicker={"{format:'" + helpers.getShortDateFormat() + "'}"}
              />
            </div>
            <div className='uk-width-1-2' style={{ padding: '0 0 0 15px' }}>
              <label htmlFor='filterDate_End' className='uk-form-label nopadding nomargin'>
                Date End
              </label>
              <input
                id='filterDate_End'
                className='md-input'
                name='filterDate_End'
                type='text'
                data-uk-datepicker={"{format:'" + helpers.getShortDateFormat() + "'}"}
              />
            </div>
          </div>
          <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
            <div className='uk-width-1-1'>
              <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
                Status
              </label>
              <SingleSelect items={statuses} showTextbox={false} multiple={true} ref={r => (this.statusSelect = r)} />
            </div>
          </div>
          <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
            <div className='uk-width-1-1'>
              <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
                Store Tags
              </label>
              <SingleSelect items={tags} showTextbox={true} multiple={true} ref={r => (this.tagsSelect = r)} />
            </div>
          </div>
          <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
            <div className='uk-width-1-1'>
              <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
                Ticket Type
              </label>
              <SingleSelect items={types} showTextbox={false} multiple={true} ref={r => (this.typesSelect = r)} />
            </div>
          </div>
          <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
            <div className='uk-width-1-1'>
              <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
                State
              </label>
              <SingleSelect
                items={ticketStates}
                showTextbox={false}
                multiple={true}
                ref={r => (this.ticketStateSelect = r)}
                onSelectChange={this.onTicketStateFilterChanged}
              />
            </div>
          </div>
          <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
            <div className='uk-width-1-1'>
              <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
                Staff Name
              </label>
              <SingleSelect
                items={staffs}
                showTextbox={true}
                multiple={true}
                ref={r => (this.staffSelect = r)}
              />
            </div>
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={'Cancel'} flat={true} waves={true} extraClass={'uk-modal-close'} />
            <Button text={'Apply Filter'} style={'primary'} flat={false} type={'submit'} />
          </div>
        </form>
      </BaseModal>
    )
  }
}

FilterTicketsModal.propTypes = {
  viewdata: PropTypes.object.isRequired,
  groupsState: PropTypes.object.isRequired,
  hideModal: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  unloadGroups: PropTypes.func.isRequired,
  getTagsWithPage: PropTypes.func.isRequired,
  ticketTags: PropTypes.object.isRequired,
  fetchTicketTypes: PropTypes.func.isRequired,
  ticketTypes: PropTypes.object.isRequired,
  fetchTicketStatus: PropTypes.func.isRequired,
  ticketStatuses: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  viewdata: state.common.viewdata,
  groupsState: state.groupsState,
  ticketTags: state.tagsSettings.tags,
  ticketTypes: state.ticketsState.types,
  ticketStatuses: state.ticketsState.ticketStatuses
})

export default connect(mapStateToProps, {
  hideModal,
  fetchGroups,
  unloadGroups,
  getTagsWithPage,
  fetchTicketTypes,
  fetchTicketStatus
})(FilterTicketsModal)
