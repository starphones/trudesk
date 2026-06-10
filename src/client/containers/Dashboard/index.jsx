import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'

import {
  fetchDashboardCompletedCount,
  fetchDashboardData,
  fetchDashboardTopGroups,
  fetchDashboardTopTags,
  fetchDashboardOverdueTickets
} from 'actions/dashboard'

import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'
import PageTitle from 'components/PageTitle'
import PageContent from 'components/PageContent'
import TruCard from 'components/TruCard'
import SingleSelect from 'components/SingleSelect'
import CountUp from 'components/CountUp'
import PeityBar from 'components/Peity/peity-bar'
import PeityPie from 'components/Peity/peity-pie'
import PeityLine from 'components/Peity/peity-line'
import MGraph from 'components/MGraph'
import D3Pie from 'components/D3/d3pie' 

import moment from 'moment-timezone'
import helpers from 'lib/helpers'
import api from '../../api'

const SHOW_DASHBOARD_MAINTENANCE_NOTICE = false
const STATUS_IDS = {
  todo: '69d5fc08cba9230a0926fff8',
  inprogress: '69d5fc08cba9230a0926fff9',
  pending: '69d5fc08cba9230a0926fffa',
  resolved: '69d5fc08cba9230a0926fffb',
  refund: '69d70f5633a3c86ce7482822',
  closed: '69dde70ce628e832b70a8b72',
  refunded: '69dde72ce628e832b70a8bd9'
}

@observer
class DashboardContainer extends React.Component {
  @observable timespan = 30
  @observable agentOverview = {
    loading: false,
    totalCount: 0,
    productRelatedCount: 0,
    repairRelatedCount: 0,
    productTodoCount: 0,
    productPendingCount: 0,
    productInProgressCount: 0,
    productClosedCount: 0,
    productEscalatedCount: 0,
    productCompletedCount: 0,
    productAvgFirstResponse: '0 Mins',
    productAvgCompletionTime: '0 Mins',
    repairTodoCount: 0,
    repairPendingCount: 0,
    repairInProgressCount: 0,
    repairClosedCount: 0,
    repairEscalatedCount: 0,
    repairCompletedCount: 0,
    repairAvgFirstResponse: '0 Mins',
    repairAvgCompletionTime: '0 Mins',
    otherCount: 0,
    productTypeId: null,
    repairTypeId: null
  }
  @observable employeeOverview = {
    loading: false,
    totalCount: 0,
    ticketsWithStaffNameCount: 0,
    staffFaultYesCount: 0,
    staffFaultNoCount: 0,
    uniqueStaffCount: 0,
    uniqueStoreCount: 0,
    uniqueStateCount: 0,
    topStaffFaults: [],
    topStoreFaults: [],
    topStateFaults: [],
    topStores: [],
    topStates: []
  }

  constructor (props) {
    super(props)
    makeObservable(this)
  }

  componentDidMount () {
    helpers.UI.setupPeity()

    this.props.fetchDashboardData({ timespan: this.timespan })

    if (this.isAgentDashboard()) {
      this.props.fetchDashboardCompletedCount({ timespan: this.timespan })
      this.fetchAgentOverview()
    } else if (this.isEmployeeDashboard()) {
      this.fetchEmployeeOverview()
    } else {
      this.props.fetchDashboardOverdueTickets()
      this.props.fetchDashboardCompletedCount({ timespan: this.timespan })
      this.props.fetchDashboardTopGroups({ timespan: this.timespan })
      this.props.fetchDashboardTopTags({ timespan: this.timespan })
    }
  }

  onTimespanChange = e => {
    e.preventDefault()
    this.timespan = e.target.value
    this.props.fetchDashboardData({ timespan: e.target.value })

    if (this.isAgentDashboard()) {
      this.props.fetchDashboardCompletedCount({ timespan: e.target.value })
      this.fetchAgentOverview()
    } else if (this.isEmployeeDashboard()) {
      this.fetchEmployeeOverview()
    } else {
      this.props.fetchDashboardCompletedCount({ timespan: e.target.value })
      this.props.fetchDashboardTopGroups({ timespan: e.target.value })
      this.props.fetchDashboardTopTags({ timespan: e.target.value })
    }
  }

  getStatusFilterHref = statusKey => {
    const statusId = STATUS_IDS[statusKey]
    if (!statusId) return '#'
    return `/tickets/filter/?f=1&st=${encodeURIComponent(statusId)}`
  }

  getTypeFilterHref = typeId => {
    if (!typeId) return '#'
    return `/tickets/filter/?f=1&tt=${encodeURIComponent(typeId)}`
  }

  isAgentDashboard = () => {
    return window.location.pathname.indexOf('/dashboard/agent') === 0
  }

  isEmployeeDashboard = () => {
    return window.location.pathname.indexOf('/dashboard/employee') === 0
  }

  fetchAgentOverview = async () => {
    this.agentOverview = {
      ...this.agentOverview,
      loading: true
    }

    try {
      const response = await api.dashboard.getAgentOverview({ timespan: Number(this.timespan) })
      this.agentOverview = {
        loading: false,
        ...response
      }
    } catch (error) {
      this.agentOverview = {
        ...this.agentOverview,
        loading: false
      }

      const errorText = error.response ? error.response.data.error : 'Unable to load agent dashboard overview.'
      helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    }
  }

  fetchEmployeeOverview = async () => {
    this.employeeOverview = {
      ...this.employeeOverview,
      loading: true
    }

    try {
      const response = await api.dashboard.getEmployeeOverview({ timespan: Number(this.timespan) })
      this.employeeOverview = {
        loading: false,
        ...response
      }
    } catch (error) {
      this.employeeOverview = {
        ...this.employeeOverview,
        loading: false
      }

      const errorText = error.response ? error.response.data.error : 'Unable to load employee dashboard overview.'
      helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    }
  }

  renderOverdueTicketsTable = overdueTickets => {
    return (
      <div className='uk-overflow-container'>
        <table className='uk-table'>
          <thead>
            <tr>
              <th className='uk-text-nowrap'>Ticket</th>
              <th className='uk-text-nowrap'>Status</th>
              <th className='uk-text-nowrap'>Subject</th>
              <th className='uk-text-nowrap uk-text-right'>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {overdueTickets.map(ticket => {
              return (
                <tr key={ticket.get('_id')} className={'uk-table-middle'}>
                  <td className={'uk-width-1-10 uk-text-nowrap'}>
                    <a href={`/tickets/${ticket.get('uid')}`}>T#{ticket.get('uid')}</a>
                  </td>
                  <td className={'uk-width-1-10 uk-text-nowrap'}>
                    <span className={'uk-badge ticket-status-open uk-width-1-1 ml-0'}>Open</span>
                  </td>
                  <td className={'uk-width-6-10'}>{ticket.get('subject')}</td>
                  <td className={'uk-width-2-10 uk-text-right uk-text-muted uk-text-small'}>
                    {moment
                      .utc(ticket.get('updated'))
                      .tz(helpers.getTimezone())
                      .format(helpers.getShortDateFormat())}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  renderAgentDashboard = (dashboardState, lastUpdatedFormatted, completedCount) => {
    const activeQueue = (dashboardState.totalTodo || 0) + (dashboardState.totalPending || 0) + (dashboardState.totalInProgress || 0)
    const completionPercent = this.agentOverview.totalCount
      ? Math.round((completedCount / this.agentOverview.totalCount) * 100)
      : 0
    const typeMixData = [
      ['Product Related', this.agentOverview.productRelatedCount || 0],
      ['Repair Related', this.agentOverview.repairRelatedCount || 0],
      ['Other', this.agentOverview.otherCount || 0]
    ].filter(item => item[1] > 0)
    const queueTileStyle = color => ({
      border: `1px solid ${color}`,
      borderRadius: 12,
      padding: '18px 20px',
      background: `${color}12`
    })

    return (
      <div>
        <PageTitle
          title={'Agent Dashboard'}
          rightComponent={
            <div>
              <div className={'uk-float-right'} style={{ minWidth: 250 }}>
                <div style={{ marginTop: 8 }}>
                  <SingleSelect
                    items={[
                      { text: 'Last 30 Days', value: '30' },
                      { text: 'Last 60 Days', value: '60' },
                      { text: 'Last 90 Days', value: '90' },
                      { text: 'Last 180 Days', value: '180' },
                      { text: 'Last 365 Days', value: '365' }
                    ]}
                    defaultValue={this.timespan.toString()}
                    onSelectChange={e => this.onTimespanChange(e)}
                  />
                </div>
              </div>
              <div className={'uk-float-right uk-text-muted uk-text-small'} style={{ margin: '23px 25px 0 0' }}>
                <strong>Last Updated: </strong>
                <span>{lastUpdatedFormatted}</span>
              </div>
            </div>
          }
        />
        <PageContent>
          <Grid>
            <GridItem width={'1-2'}>
              <TruCard
                style={{ minHeight: 300 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Overall Stats</h6>
                  </div>
                }
                content={
                  <div className='uk-grid uk-grid-small' data-uk-grid>
                    <div className='uk-width-1-2'>
                      <div style={{ border: '1px solid #eceff5', borderRadius: 12, padding: '18px 20px' }}>
                        <div className='uk-text-muted uk-text-small'>Product Related</div>
                        <h2 className='uk-margin-remove'>
                          <a href={this.getTypeFilterHref(this.agentOverview.productTypeId)} style={{ color: 'inherit' }}>
                            <CountUp startNumber={0} endNumber={this.agentOverview.productRelatedCount || 0} />
                          </a>
                        </h2>
                      </div>
                    </div>
                    <div className='uk-width-1-2'>
                      <div style={{ border: '1px solid #eceff5', borderRadius: 12, padding: '18px 20px' }}>
                        <div className='uk-text-muted uk-text-small'>Repair Related</div>
                        <h2 className='uk-margin-remove'>
                          <a href={this.getTypeFilterHref(this.agentOverview.repairTypeId)} style={{ color: 'inherit' }}>
                            <CountUp startNumber={0} endNumber={this.agentOverview.repairRelatedCount || 0} />
                          </a>
                        </h2>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={{ border: '1px solid #eceff5', borderRadius: 12, padding: '18px 20px' }}>
                        <div className='uk-text-muted uk-text-small'>Active Queue</div>
                        <h2 className='uk-margin-remove'>
                          <CountUp startNumber={0} endNumber={activeQueue} />
                        </h2>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={{ border: '1px solid #eceff5', borderRadius: 12, padding: '18px 20px' }}>
                        <div className='uk-text-muted uk-text-small'>Completed This Period</div>
                        <h2 className='uk-margin-remove'>{completionPercent}%</h2>
                      </div>
                    </div>
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'}>
              <TruCard
                style={{ minHeight: 300 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Type Mix</h6>
                  </div>
                }
                content={
                  <div>
                    <D3Pie type={'donut'} data={typeMixData} />
                  </div>
                }
              />
            </GridItem>
          </Grid>

          <Grid>
            <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Product Related Performance</h6>
                  </div>
                }
                content={
                  <div className='uk-grid uk-grid-small' data-uk-grid>
                    <div className='uk-width-1-2'>
                      <div style={queueTileStyle('#2563eb')}>
                        <div className='uk-text-muted uk-text-small'>Avg First Response</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{this.agentOverview.productAvgFirstResponse || '0 Mins'}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2'>
                      <div style={queueTileStyle('#0f766e')}>
                        <div className='uk-text-muted uk-text-small'>Avg Completion Time</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{this.agentOverview.productAvgCompletionTime || '0 Mins'}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={queueTileStyle('#059669')}>
                        <div className='uk-text-muted uk-text-small'>Completed</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{this.agentOverview.productCompletedCount || 0}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={queueTileStyle('#dc2626')}>
                        <div className='uk-text-muted uk-text-small'>Escalated</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{this.agentOverview.productEscalatedCount || 0}</div>
                      </div>
                    </div>
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Repair Related Performance</h6>
                  </div>
                }
                content={
                  <div className='uk-grid uk-grid-small' data-uk-grid>
                    <div className='uk-width-1-2'>
                      <div style={queueTileStyle('#2563eb')}>
                        <div className='uk-text-muted uk-text-small'>Avg First Response</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{this.agentOverview.repairAvgFirstResponse || '0 Mins'}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2'>
                      <div style={queueTileStyle('#0f766e')}>
                        <div className='uk-text-muted uk-text-small'>Avg Completion Time</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{this.agentOverview.repairAvgCompletionTime || '0 Mins'}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={queueTileStyle('#059669')}>
                        <div className='uk-text-muted uk-text-small'>Completed</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{this.agentOverview.repairCompletedCount || 0}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={queueTileStyle('#dc2626')}>
                        <div className='uk-text-muted uk-text-small'>Escalated</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{this.agentOverview.repairEscalatedCount || 0}</div>
                      </div>
                    </div>
                  </div>
                }
              />
            </GridItem>
          </Grid>

          <Grid>
            <GridItem width={'1-2'}>
              <TruCard
                style={{ minHeight: 300 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Queue Snapshot - Product Related</h6>
                  </div>
                }
                content={
                  <div className='uk-grid uk-grid-small' data-uk-grid>
                    <div className='uk-width-1-2'>
                      <div style={queueTileStyle('#4f6bed')}>
                        <div className='uk-text-muted uk-text-small'>Todo</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{this.agentOverview.productTodoCount || 0}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2'>
                      <div style={queueTileStyle('#f59e0b')}>
                        <div className='uk-text-muted uk-text-small'>Pending</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{this.agentOverview.productPendingCount || 0}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={queueTileStyle('#10b981')}>
                        <div className='uk-text-muted uk-text-small'>In Progress</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{this.agentOverview.productInProgressCount || 0}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={queueTileStyle('#64748b')}>
                        <div className='uk-text-muted uk-text-small'>Closed</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{this.agentOverview.productClosedCount || 0}</div>
                      </div>
                    </div>
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'}>
              <TruCard
                style={{ minHeight: 300 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Queue Snapshot - Repair Related</h6>
                  </div>
                }
                content={
                  <div className='uk-grid uk-grid-small' data-uk-grid>
                    <div className='uk-width-1-2'>
                      <div style={queueTileStyle('#4f6bed')}>
                        <div className='uk-text-muted uk-text-small'>Todo</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{this.agentOverview.repairTodoCount || 0}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2'>
                      <div style={queueTileStyle('#f59e0b')}>
                        <div className='uk-text-muted uk-text-small'>Pending</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{this.agentOverview.repairPendingCount || 0}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={queueTileStyle('#10b981')}>
                        <div className='uk-text-muted uk-text-small'>In Progress</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{this.agentOverview.repairInProgressCount || 0}</div>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={queueTileStyle('#64748b')}>
                        <div className='uk-text-muted uk-text-small'>Closed</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{this.agentOverview.repairClosedCount || 0}</div>
                      </div>
                    </div>
                    
                  </div>
                }
              />
            </GridItem>
          </Grid>
        </PageContent>
      </div>
    )
  }

  renderRankedList = (items, emptyText) => {
    if (!items || items.length < 1) {
      return <div className='uk-text-muted uk-text-small'>{emptyText}</div>
    }

    return (
      <div>
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className='uk-flex uk-flex-between uk-flex-middle'
            style={{
              padding: '10px 0',
              borderBottom: index === items.length - 1 ? 'none' : '1px solid #eef1f6'
            }}
          >
            <span style={{ fontWeight: 500 }}>{item.name}</span>
            <span className='uk-text-muted'>{item.count}</span>
          </div>
        ))}
      </div>
    )
  }

  renderStaffFaultList = (items, emptyText) => {
    if (!items || items.length < 1) {
      return <div className='uk-text-muted uk-text-small'>{emptyText}</div>
    }

    return (
      <div>
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            style={{
              padding: '10px 0',
              borderBottom: index === items.length - 1 ? 'none' : '1px solid #eef1f6'
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.name}</div>
            <div className='uk-text-muted uk-text-small'>
              Total: {item.totalCount || 0} - Yes: {item.yesCount || 0}
            </div>
          </div>
        ))}
      </div>
    )
  }

  renderEmployeeDashboard = lastUpdatedFormatted => {
    const overview = this.employeeOverview
    const stateMixData = (overview.topStateFaults || [])
      .map(item => [item.name, item.yesCount])
      .filter(item => item[1] > 0)
    const ticketsWithoutStaffNameCount = Math.max((overview.totalCount || 0) - (overview.ticketsWithStaffNameCount || 0), 0)

    return (
      <div>
        <PageTitle
          title={'Employee Dashboard'}
          rightComponent={
            <div>
              <div className={'uk-float-right'} style={{ minWidth: 250 }}>
                <div style={{ marginTop: 8 }}>
                  <SingleSelect
                    items={[
                      { text: 'Last 30 Days', value: '30' },
                      { text: 'Last 60 Days', value: '60' },
                      { text: 'Last 90 Days', value: '90' },
                      { text: 'Last 180 Days', value: '180' },
                      { text: 'Last 365 Days', value: '365' }
                    ]}
                    defaultValue={this.timespan.toString()}
                    onSelectChange={e => this.onTimespanChange(e)}
                  />
                </div>
              </div>
              <div className={'uk-float-right uk-text-muted uk-text-small'} style={{ margin: '23px 25px 0 0' }}>
                <strong>Last Updated: </strong>
                <span>{lastUpdatedFormatted}</span>
              </div>
            </div>
          }
        />
        <PageContent>
          <Grid>
            <GridItem width={'1-2'}>
              <TruCard
                style={{ minHeight: 300 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Employee Ticket Overview</h6>
                  </div>
                }
                content={
                  <div className='uk-grid uk-grid-small' data-uk-grid>
                    <div className='uk-width-1-2'>
                      <div style={{ border: '1px solid #eceff5', borderRadius: 12, padding: '18px 20px' }}>
                        <div className='uk-text-muted uk-text-small'>Total Tickets</div>
                        <h2 className='uk-margin-remove'>
                          <CountUp startNumber={0} endNumber={overview.totalCount || 0} />
                        </h2>
                      </div>
                    </div>
                    <div className='uk-width-1-2'>
                      <div style={{ border: '1px solid #eceff5', borderRadius: 12, padding: '18px 20px' }}>
                        <div className='uk-text-muted uk-text-small'>Tickets Without Assignee</div>
                        <h2 className='uk-margin-remove'>
                          <CountUp startNumber={0} endNumber={ticketsWithoutStaffNameCount} />
                        </h2>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={{ border: '1px solid #eceff5', borderRadius: 12, padding: '18px 20px' }}>
                        <div className='uk-text-muted uk-text-small'>Staff Fault Yes</div>
                        <h2 className='uk-margin-remove'>
                          <CountUp startNumber={0} endNumber={overview.staffFaultYesCount || 0} />
                        </h2>
                      </div>
                    </div>
                    <div className='uk-width-1-2 uk-margin-top'>
                      <div style={{ border: '1px solid #eceff5', borderRadius: 12, padding: '18px 20px' }}>
                        <div className='uk-text-muted uk-text-small'>Staff Fault No</div>
                        <h2 className='uk-margin-remove'>
                          <CountUp startNumber={0} endNumber={overview.staffFaultNoCount || 0} />
                        </h2>
                      </div>
                    </div>
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'}>
              <TruCard
                style={{ minHeight: 300 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Percentage of State with Fault</h6>
                  </div>
                }
                content={<div>{stateMixData.length > 0 ? <D3Pie type={'donut'} data={stateMixData} /> : <div className='uk-text-muted uk-text-small'>No state data for this period.</div>}</div>}
              />
            </GridItem>
          </Grid>

          <Grid>
            <GridItem width={'1-3'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                style={{ minHeight: 320 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Top Staff With Fault</h6>
                  </div>
                }
                content={this.renderStaffFaultList(overview.topStaffFaults, 'No staff fault data found for this period.')}
              />
            </GridItem>
            <GridItem width={'1-3'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                style={{ minHeight: 320 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Top Stores With Fault</h6>
                  </div>
                }
                content={this.renderStaffFaultList(overview.topStoreFaults, 'No store fault data found for this period.')}
              />
            </GridItem>
            <GridItem width={'1-3'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                style={{ minHeight: 320 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Top States With Fault</h6>
                  </div>
                }
                content={this.renderStaffFaultList(overview.topStateFaults, 'No state fault data found for this period.')}
              />
            </GridItem>
          </Grid>
        </PageContent>
      </div>
    )
  }

  render () {
    const isAgentDashboard = this.isAgentDashboard()
    const isEmployeeDashboard = this.isEmployeeDashboard()

    if (SHOW_DASHBOARD_MAINTENANCE_NOTICE) {
      return (
        <div data-testid='dashboard-maintenance-notice'>
          <PageTitle title={'Dashboard'} />
          <PageContent>
            <Grid>
              <GridItem width={'1-1'}>
                <TruCard
                  content={
                    <div style={{ padding: '30px 10px' }}>
                      <h3 style={{ marginTop: 0 }}>Dashboard Temporarily Unavailable</h3>
                      <p className='uk-text-muted' style={{ marginBottom: 10 }}>
                        We&apos;re currently working on improvements to the dashboard.
                      </p>
                      <p className='uk-text-muted' style={{ marginBottom: 0 }}>
                        Please check back shortly. The rest of the helpdesk is still available as normal.
                      </p>
                    </div>
                  }
                />
              </GridItem>
            </Grid>
          </PageContent>
        </div>
      )
    }

    const dashboardState = this.props.dashboardState || {}
    const ticketBreakdownData = dashboardState.ticketBreakdownData && dashboardState.ticketBreakdownData.toJS
      ? dashboardState.ticketBreakdownData.toJS()
      : []
    const topGroups = dashboardState.topGroups && dashboardState.topGroups.toJS ? dashboardState.topGroups.toJS() : []
    const topTags = dashboardState.topTags && dashboardState.topTags.toJS ? dashboardState.topTags.toJS() : []
    const overdueTickets = dashboardState.overdueTickets || []

    const formatString = helpers.getLongDateFormat() + ' ' + helpers.getTimeFormat()
    const tz = helpers.getTimezone()
    const lastUpdatedFormatted = dashboardState.lastUpdated
      ? moment(dashboardState.lastUpdated, 'DD/MM/YYYY hh:mm:ssa')
          .tz(tz)
          .format(formatString)
      : 'Cache Still Loading...'

    const completedCount = dashboardState.completedCount || 0
    const closedPercent = dashboardState.ticketCount
      ? Math.round((completedCount / dashboardState.ticketCount) * 100).toString()
      : '0'
    const stripMinutes = value => {
      if (!value || typeof value !== 'string') return '0'
      const withoutMins = value.replace(/\s*\d+\s*mins?/i, '').trim()
      return withoutMins.length > 0 ? withoutMins : '< 1h'
    }

    if (isAgentDashboard) {
      return this.renderAgentDashboard(dashboardState, lastUpdatedFormatted, completedCount)
    }

    if (isEmployeeDashboard) {
      return this.renderEmployeeDashboard(lastUpdatedFormatted)
    }

    return (
      <div>
        <PageTitle
          title={'Dashboard'}
          rightComponent={
            <div>
              <div className={'uk-float-right'} style={{ minWidth: 250 }}>
                <div style={{ marginTop: 8 }}>
                  <SingleSelect
                    items={[
                      { text: 'Last 30 Days', value: '30' },
                      { text: 'Last 60 Days', value: '60' },
                      { text: 'Last 90 Days', value: '90' },
                      { text: 'Last 180 Days', value: '180' },
                      { text: 'Last 365 Days', value: '365' }
                    ]}
                    defaultValue={this.timespan.toString()}
                    onSelectChange={e => this.onTimespanChange(e)}
                  />
                </div>
              </div>
              <div className={'uk-float-right uk-text-muted uk-text-small'} style={{ margin: '23px 25px 0 0' }}>
                <strong>Last Updated: </strong>
                <span>{lastUpdatedFormatted}</span>
              </div>
            </div>
          }
        />
        <PageContent>
          <Grid>
            <GridItem width={'1-2'}>
              <TruCard
                content={
                  <div>
                    <div className='right uk-margin-top uk-margin-small-right'>
                      <PeityBar values={'5,3,9,6,5,9,7'} />
                    </div>
                    <span className='uk-text-muted uk-text-small'>
                      Total Tickets (last {this.timespan.toString()}d)
                    </span>

                    <h2 className='uk-margin-remove'>
                      <CountUp startNumber={0} endNumber={dashboardState.ticketCount || 0} />
                    </h2>
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'}>
              <TruCard
                content={
                  <div>
                    <div className='right uk-margin-top uk-margin-small-right'>
                      <PeityPie type={'donut'} value={(closedPercent !== 'NaN' ? closedPercent : '0') + '/100'} />
                    </div>
                    <span className='uk-text-muted uk-text-small'>Tickets Completed</span>

                    <h2 className='uk-margin-remove'>
                      <span>{closedPercent !== 'NaN' ? closedPercent : '0'}</span>%
                    </h2>
                  </div>
                }
              />
            </GridItem>
          </Grid>

          <Grid>
            <GridItem width={'1-2'}>
              <TruCard
                content={
                  <div>
                    <div className='uk-flex uk-flex-middle uk-margin-bottom'>
                      <div
                        className='uk-flex uk-flex-center uk-flex-middle'
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: 'rgba(31,168,90,0.1)',
                          marginRight: 14
                        }}
                      >
                        <i className='material-icons' style={{ color: '#1fa85a' }}>
                          trending_up
                        </i>
                      </div>
                      <span className='uk-text-muted uk-text-small' style={{ fontSize: 14, letterSpacing: '0.02em' }}>
                        AVERAGE COMPLETION TIME
                      </span>
                    </div>

                    <h2 className='uk-margin-remove' style={{ fontSize: 32, lineHeight: 1.15, fontWeight: 700 }}>
                      {stripMinutes(dashboardState.ticketAvgTodoToResolved || '0 Mins')}
                    </h2>

                    <div className='uk-grid uk-grid-small uk-margin-medium-top uk-margin-medium-bottom' data-uk-grid>
                      <div className='uk-width-1-2'>
                        <div style={{ border: '1px solid #d8ebe0', borderRadius: 14, padding: '18px 20px' }}>
                          <div className='uk-text-muted uk-text-small'>
                            Fastest Completion
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15 }}>
                            {stripMinutes(dashboardState.fastestTodoToResolved || '0 Mins')}
                          </div>
                        </div>
                      </div>
                      <div className='uk-width-1-2'>
                        <div style={{ border: '1px solid #dbe4f3', borderRadius: 14, padding: '18px 20px' }}>
                          <div className='uk-text-muted uk-text-small'>
                            Longest Completion
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15 }}>
                            {stripMinutes(dashboardState.longestTodoToResolved || '0 Mins')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className='uk-margin-medium' />
                    <div className='uk-grid uk-grid-medium uk-text-muted uk-margin-top' data-uk-grid>
                      <div className='uk-width-1-3'>
                        <a
                          href={this.getStatusFilterHref('closed')}
                          style={{ color: 'inherit' }}
                        >
                          Closed: <strong style={{ color: '#1fa85a' }}>{dashboardState.totalClosed || 0}</strong>
                        </a>
                      </div>
                      <div className='uk-width-1-3'>
                        <a
                          href={this.getStatusFilterHref('refunded')}
                          style={{ color: 'inherit' }}
                        >
                          Refunded: <strong style={{ color: '#d09a08' }}>{dashboardState.totalRefunded || 0}</strong>
                        </a>
                      </div>
                      <div className='uk-width-1-3'>
                        <a
                          href={this.getStatusFilterHref('resolved')}
                          style={{ color: 'inherit' }}
                        >
                          Resolved: <strong style={{ color: '#2a6fd1' }}>{dashboardState.totalResolvedOnly || 0}</strong>
                        </a>
                      </div>
                      <div className='uk-width-1-3'>
                        <a
                          href={this.getStatusFilterHref('todo')}
                          style={{ color: 'inherit' }}
                        >
                          Todo: <strong>{dashboardState.totalTodo || 0}</strong>
                        </a>
                      </div>
                      <div className='uk-width-1-3'>
                        <a
                          href={this.getStatusFilterHref('pending')}
                          style={{ color: 'inherit' }}
                        >
                          Pending: <strong>{dashboardState.totalPending || 0}</strong>
                        </a>
                      </div>
                      <div className='uk-width-1-3'>
                        <a
                          href={this.getStatusFilterHref('inprogress')}
                          style={{ color: 'inherit' }}
                        >
                          In Progress: <strong>{dashboardState.totalInProgress || 0}</strong>
                        </a>
                      </div>
                    </div>
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'}>
              <TruCard
                content={
                  <div>
                    <div className='uk-flex uk-flex-middle uk-margin-bottom'>
                      <div
                        className='uk-flex uk-flex-center uk-flex-middle'
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: 'rgba(42,111,209,0.1)',
                          marginRight: 14
                        }}
                      >
                        <i className='material-icons' style={{ color: '#2a6fd1' }}>
                          timer
                        </i>
                      </div>
                      <span className='uk-text-muted uk-text-small' style={{ fontSize: 14, letterSpacing: '0.02em' }}>
                        AVERAGE RESPONSE TIMES
                      </span>
                    </div>

                    <div className='uk-grid uk-grid-small' data-uk-grid>
                      <div className='uk-width-1-1 uk-margin-small-bottom'>
                        <div style={{ border: '1px solid #dbe4f3', borderRadius: 12, padding: '12px 14px' }}>
                          <div className='uk-text-muted uk-text-small'>Todo -> Pending</div>
                          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15 }}>
                            {dashboardState.ticketAvg || '0 Mins'}
                          </div>
                        </div>
                      </div>
                      
                      <div className='uk-width-1-1 uk-margin-small-bottom'>
                        <div style={{ border: '1px solid #dbe4f3', borderRadius: 12, padding: '12px 14px' }}>
                          <div className='uk-text-muted uk-text-small'>Pending -> In Progress</div>
                          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15 }}>
                            {dashboardState.ticketAvgPendingToInProgress || '0 Mins'}
                          </div>
                        </div>
                      </div>
                      
                      <div className='uk-width-1-1'>
                        <div style={{ border: '1px solid #dbe4f3', borderRadius: 12, padding: '12px 14px' }}>
                          <div className='uk-text-muted uk-text-small'>In Progress -> Pending</div>
                          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15 }}>
                            {dashboardState.ticketAvgInProgressToPending || '0 Mins'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            </GridItem>
          </Grid>

          <Grid>
            <GridItem width={'1-1'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Ticket Breakdown</h6>
                  </div>
                }
                fullSize={true}
                hover={false}
                extraContentClass={'nopadding'}
                content={
                  <div className='mGraph mGraph-panel' style={{ minHeight: 200, position: 'relative' }}>
                    <MGraph
                      height={250}
                      x_accessor={'date'}
                      y_accessor={'value'}
                      data={ticketBreakdownData}
                    />
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                loaderActive={dashboardState.loadingTopGroups}
                animateLoader={true}
                style={{ minHeight: 256 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Most Tickets per State</h6>
                  </div>
                }
                content={
                  <div>
                    <D3Pie data={topGroups} />
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                loaderActive={dashboardState.loadingTopTags}
                animateLoader={true}
                animateDelay={800}
                style={{ minHeight: 256 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Top 10 Tags</h6>
                  </div>
                }
                content={
                  <div>
                    <D3Pie type={'donut'} data={topTags} />
                  </div>
                }
              />
            </GridItem>
            <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                style={{ minHeight: 250 }}
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Overdue Tickets</h6>
                  </div>
                }
                content={
                  this.renderOverdueTicketsTable(overdueTickets)
                }
              />
            </GridItem>
            <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
              <TruCard
                header={
                  <div className='uk-text-left'>
                    <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Quick Stats (Last 365 Days)</h6>
                  </div>
                }
                content={
                  <div className='uk-overflow-container'>
                    <table className='uk-table'>
                      <thead>
                        <tr>
                          <th className='uk-text-nowrap'>Stat</th>
                          <th className='uk-text-nowrap uk-text-right'>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className='uk-table-middle'>
                          <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                            Most tickets by...
                          </td>
                          <td id='mostRequester' className='uk-width-4-10 uk-text-right  uk-text-small'>
                            {dashboardState.mostRequester
                              ? `${dashboardState.mostRequester.get(
                                  'name'
                                )} (${dashboardState.mostRequester.get('value')})`
                              : '--'}
                          </td>
                        </tr>

                        <tr className='uk-table-middle'>
                          <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                            Most comments by....
                          </td>
                          <td id='mostCommenter' className='uk-width-4-10 uk-text-right  uk-text-small'>
                            {dashboardState.mostCommenter
                              ? `${dashboardState.mostCommenter.get(
                                  'name'
                                )} (${dashboardState.mostCommenter.get('value')})`
                              : '--'}
                          </td>
                        </tr>

                        <tr className='uk-table-middle'>
                          <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                            Most assigned support user....
                          </td>
                          <td id='mostAssignee' className='uk-width-4-10 uk-text-right  uk-text-small'>
                            {dashboardState.mostAssignee
                              ? `${dashboardState.mostAssignee.get(
                                  'name'
                                )} (${dashboardState.mostAssignee.get('value')})`
                              : '--'}
                          </td>
                        </tr>

                        <tr className='uk-table-middle'>
                          <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                            Most active ticket...
                          </td>
                          <td className='uk-width-4-10 uk-text-right  uk-text-small'>
                            <a id='mostActiveTicket' href='#'>
                              {dashboardState.mostActiveTicket
                                ? `T#${dashboardState.mostActiveTicket.get('uid')}`
                                : '--'}
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                }
              />
            </GridItem>
          </Grid>
        </PageContent>
      </div>
    )
  }
}

DashboardContainer.propTypes = {
  fetchDashboardData: PropTypes.func.isRequired,
  fetchDashboardTopGroups: PropTypes.func.isRequired,
  fetchDashboardTopTags: PropTypes.func.isRequired,
  fetchDashboardOverdueTickets: PropTypes.func.isRequired,
  dashboardState: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  dashboardState: state.dashboardState
})

export default connect(mapStateToProps, {
  fetchDashboardCompletedCount,
  fetchDashboardData,
  fetchDashboardTopGroups,
  fetchDashboardTopTags,
  fetchDashboardOverdueTickets
})(DashboardContainer)
