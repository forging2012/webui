import {expect} from 'chai'
import {put, take, fork, call, cancel} from 'redux-saga'
import {createMockTask} from 'redux-saga/lib/testUtils'

import * as actions from '../../app/scripts/actions'
import {
  fetchId,
  loadId,
  watchLogs,
  watchLoadHomePage,
  watchLoadLogsPage,
  watchNavigate
} from '../../app/scripts/sagas'
import {api, history} from '../../app/scripts/services'

const id = {}
const state = {id}
const getState = () => state

describe('sagas', () => {
  describe('fetchId', () => {
    it('success', () => {
      const generator = fetchId(getState)

      let next = generator.next()
      expect(next.value).to.be.eql(put(actions.id.request()))

      next = generator.next()
      expect(next.value).to.be.eql(call(api.fetchId))

      next = generator.next(actions.id.success('hello'))
      expect(next.value).to.be.eql(put(actions.id.success('hello')))
    })

    it('failure', () => {
      const generator = fetchId(getState)

      let next = generator.next()
      expect(next.value).to.be.eql(put(actions.id.request()))

      next = generator.next()
      expect(next.value).to.be.eql(call(api.fetchId))

      next = generator.next(actions.id.failure('error'))
      expect(next.value).to.be.eql(put(actions.id.failure('error')))
    })
  })

  it('loadId', () => {
    const generator = loadId(getState)

    let next = generator.next()
    expect(next.value).to.be.eql(call(fetchId))
  })

  it('watchLogs', () => {
    const source = {
      nextMessage () {
        return 1
      }
    }
    const generator = watchLogs(source)

    let next = generator.next()
    expect(next.value).to.be.eql(call(source.nextMessage))

    next = generator.next('log')
    expect(next.value).to.be.eql(put(actions.logs.receive('log')))

    next = generator.next()
    expect(next.value).to.be.eql(call(source.nextMessage))

    next = generator.next('log2')
    expect(next.value).to.be.eql(put(actions.logs.receive('log2')))
  })

  it('watchLoadHomePage', () => {
    const generator = watchLoadHomePage(getState)

    let next = generator.next()
    expect(next.value).to.be.eql(take(actions.LOAD_HOME_PAGE))

    next = generator.next()
    expect(next.value).to.be.eql(fork(loadId))
  })

  it('watchLoadLogsPage', () => {
    const generator = watchLoadLogsPage(getState)

    let next = generator.next()
    expect(next.value)
      .to.be.eql(call(api.createLogSource))

    next = generator.next('source')
    expect(next.value)
      .to.be.eql(take(actions.LOAD_LOGS_PAGE))

    next = generator.next('source')
    expect(next.value)
      .to.be.eql(fork(watchLogs, 'source'))

    const watcher = createMockTask()
    next = generator.next(watcher)
    expect(next.value)
      .to.be.eql(take(actions.LEAVE_LOGS_PAGE))

    next = generator.next(watcher)
    expect(next.value)
      .to.be.eql(cancel(watcher))
  })

  it('watchNavigate', () => {
    const generator = watchNavigate(getState)

    let next = generator.next()
    expect(next.value).to.be.eql(take(actions.NAVIGATE))

    next = generator.next({pathname: '/hello'})
    expect(next.value).to.be.eql(history.push('/hello'))
  })
})