import { useEffect, useState } from 'react'
import { Card, CardSkeletons } from '../components/Card'
import { GroupTile, GroupSkeletons } from '../components/GroupTile'
import {
  getGroupsSorted,
  shuffleInPlace,
  cards as allCards,
  type Card as CardType,
  type Group,
} from '../lib/data'

const SKELETON_DELAY = 300
const SKELETON_MIN = 500

export function Home() {
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [cards, setCards] = useState<CardType[] | null>(null)
  const [showSkeleton, setShowSkeleton] = useState(false)

  useEffect(() => {
    let cancelled = false
    let shownAt = 0
    const timer = window.setTimeout(() => {
      if (!cancelled) {
        setShowSkeleton(true)
        shownAt = Date.now()
      }
    }, SKELETON_DELAY)

    // Sync JSON is instant — still honor skeleton min display if shown
    const nextGroups = getGroupsSorted()
    const nextCards = shuffleInPlace([...allCards])

    const finish = () => {
      if (cancelled) return
      window.clearTimeout(timer)
      const wait = shownAt
        ? Math.max(0, SKELETON_MIN - (Date.now() - shownAt))
        : 0
      window.setTimeout(() => {
        if (cancelled) return
        setGroups(nextGroups)
        setCards(nextCards)
        setShowSkeleton(false)
      }, wait)
    }

    // microtask so delay timer can arm first when work is sync
    queueMicrotask(finish)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  const loading = groups === null || cards === null

  return (
    <>
      <section className="wrap-center" style={{ paddingTop: 8 }}>
        <div className="groups-container">
          {loading && showSkeleton ? <GroupSkeletons /> : null}
          {!loading
            ? groups!.map((g) => <GroupTile key={g.slug} group={g} />)
            : null}
        </div>
      </section>

      <section className="wrap-center cards-container-0">
        <div className="cards-container-0-header">
          <h2 className="h1">
            Материалы{' '}
            <span id="cards-count" className="md-regular">
              {cards?.length ?? ''}
            </span>
          </h2>
        </div>
        <div className="cards-container">
          {loading && showSkeleton ? <CardSkeletons /> : null}
          {!loading
            ? cards!.map((c) => <Card key={c.slug} card={c} />)
            : null}
        </div>
      </section>
    </>
  )
}
