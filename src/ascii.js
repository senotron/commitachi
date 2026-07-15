// pet sprites for different moods/states

const SPRITES = {
  happy: `
    ╱|、
   (˚ˎ 。7
    |、˜〵
    じしˍ,)ノ
  `,
  eating: `
    ╱|、
   (˚ˎ 。7  nom nom~
    |、˜〵
    じしˍ,)ノ
  `,
  hungry: `
    ╱|、
   (×̩̩ ˎ 。7  ... feed me
    |、˜〵
    じしˍ,)ノ
  `,
  sleeping: `
    ╱|、
   (  ̳• ·̫  7  z Z z
    |、˜〵
    じしˍ,)ノ
  `,
  dead: `
          ___
         /RIP\\
        | ~~~ |
        |     |
        |     |
    ----+-----+----
  `,
  angry: `
    ╱|、
   (╬ ˎ 。7  < not cool bro
    |、˜〵
    じしˍ,)ノ
  `,
  egg: `
      ___
     /   \\
    | . . |
    |  u  |
     \\___/
  `,
  evolved: `
      /\\_/\\
     ( o.o )  ★ LEVEL UP ★
      > ^ <
     /|   |\\
    (_|   |_)
  `,
};

export function getSprite(state) {
  if (state.health <= 0) return SPRITES.dead;
  if (state.level <= 1) return SPRITES.egg;
  if (state.hunger >= 90) return SPRITES.hungry;
  if (state.hunger >= 70) return SPRITES.angry;
  if (state.happiness < 20) return SPRITES.sleeping;
  return SPRITES.happy;
}

export function getEatingSprite() {
  return SPRITES.eating;
}

export function getEvolvedSprite() {
  return SPRITES.evolved;
}

export { SPRITES };
