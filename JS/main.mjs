import {dev,graphics,constants,inputs,types} from './variables.mjs'
import {checkCity,orderTeam} from './functions.mjs'
import {setupGraphics,displayMain} from './graphics.mjs'
import {operation} from './operation.mjs'
var current
export function setup(){
    createCanvas(windowWidth-50,windowHeight-50)
    setupGraphics()
    current=new operation()
    window.current=current
}
export function draw(){
    if(!dev.close){
        current.display(graphics.main)
    }
    current.update(graphics.main)
    displayMain(graphics.main)
}
export function windowResized(){
    resizeCanvas(windowWidth-50,windowHeight-50)
}
export function mouseClicked(){
    if(constants.init){
        current.onClick(graphics.main,{position:{...inputs.mouse.rel}})
    }
}
export function mouseDragged(){
    if(constants.init&&!dev.close){
        current.onDrag(graphics.main,{position:{...inputs.mouse.rel}},{position:{...inputs.mouse.previous.rel}},mouseButton)
    }
}
export function keyPressed(){
    if(constants.init){
        current.onKey(graphics.main,key)
    }
}
window.setup=setup
window.draw=draw
window.windowResized=windowResized
window.mouseClicked=mouseClicked
window.mouseDragged=mouseDragged
window.keyPressed=keyPressed

window.types=types
window.dev=dev
window.checkCity=checkCity
window.orderTeam=orderTeam