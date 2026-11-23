import { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { GroupTile } from '../components/GroupTile'
import {
  getGroupsSorted,
  shuffleInPlace,
  cards as allCards,
  type Card as CardType,
  type Group,
} from '../lib/data'

/**
 * Initial state is deterministic so SSR HTML matches the first client render.
 * Cards reshuffle after hydration / mount.
 */
export function Home() {
  const [groups] = useState<Group[]>(() => getGroupsSorted())
  const [cards, setCards] = useState<CardType[]>(() => [...allCards])

  useEffect(() => {
    setCards(shuffleInPlace([...allCards]))
  }, [])

  return (
    <>
      <section className="wrap-center" style={{ paddingTop: 8 }}>
        <div className="groups-container">
          {groups.map((g) => (
            <GroupTile key={g.slug} group={g} />
          ))}
        </div>
      </section>

      <section className="wrap-center cards-container-0">
        <div className="cards-container-0-header">
          <h2 className="h1">
            Материалы{' '}
            <span id="cards-count" className="md-regular">
              {cards.length}
            </span>
          </h2>
        </div>
        <div className="cards-container">
          {cards.map((c) => (
            <Card key={c.slug} card={c} />
          ))}
        </div>
      </section>
    </>
  )
}
