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

export function Home() {
  const [groups] = useState<Group[]>(() => getGroupsSorted())
  const [cards, setCards] = useState<CardType[]>(() => [...allCards])

  useEffect(() => {
    setCards(shuffleInPlace([...allCards]))
  }, [])

  return (
    <>
      <section className="wrap-center home-groups">
        <div className="home-groups-head">
          <h2 className="section-heading">Разделы</h2>
          <p className="mono-body home-groups-lead">Выберите направление</p>
        </div>
        <div className="groups-container">
          {groups.map((g) => (
            <GroupTile key={g.slug} group={g} />
          ))}
        </div>
      </section>

      <section className="wrap-center cards-container-0 home-materials">
        <div className="materials-header">
          <h2 className="materials-title">
            Материалы
            <span id="cards-count" className="materials-count">
              {cards.length}
            </span>
          </h2>
          <p className="mono-body materials-lead">Случайная подборка из каталога</p>
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
