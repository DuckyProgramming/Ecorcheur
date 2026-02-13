import {types,graphics,listing} from './variables.mjs'
export function preload(){
    let root=``
    types.map.forEach(map=>graphics.load.map.push(map.term.map(term=>loadImage(`${root}Assets/map/${term}.png`))))
    listing.city.forEach(city=>graphics.load.city.push(loadImage(`${root}Assets/city/${city}.png`)))
    listing.team.forEach(team=>graphics.load.team.push(loadImage(`${root}Assets/team/${team}.png`)))
    listing.unit.forEach(unit=>graphics.load.unit.push(loadImage(`${root}Assets/unit/${unit}.png`)))
    graphics.load.water=loadBytes(`${root}Assets/data/water.bin`)
}
window.preload=preload
window.graphics=graphics