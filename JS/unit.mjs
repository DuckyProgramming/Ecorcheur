import {types,graphics,options} from './variables.mjs'
import {distPos,smoothAnim,moveTowardVec,inBoxBox,basicCollideBoxBox,last,randin,findId} from './functions.mjs'
import {lsin,lcos} from './graphics.mjs'
export class unit{
    constructor(operation,player,x,y,id,team,type,value){
        this.operation=operation
        this.player=player
        this.position={x:x,y:y}
        this.id=id
        this.team=team
        this.type=type
        this.value=value
        this.base={value:this.value}
        this.last={x:x,y:y}
        this.goal={position:{x:x,y:y},deviation:{x:random(-10,10),y:random(-10,10)},city:-1,nodes:[],unit:-1,mode:0,time:0,tick:0,damaged:false,victor:false}
        this.retreat={speed:1,direction:0}
        this.remove=false
        this.fade={main:0,trigger:true}
        this.speed={activation:0,max:[0,random(2.5,3),random(2.25,2.5),2,1.5][type],water:0,lastWater:0,stun:0}
        this.time=0
        this.img=[graphics.load.team[types.team[this.team].loadIndex],graphics.load.unit[this.type]]
        this.width=0
        this.height=0
        this.fortified={trigger:false,city:0}
    }
    save(){
        let composite={
            player:this.player,
            position:this.position,
            id:this.id,
            team:this.team,
            type:this.type,
            value:this.value,
            base:this.base,
            last:this.last,
            goal:{
                position:this.goal.position,
                devition:this.goal.deviation,
                city:this.goal.city==-1?this.goal.city:this.goal.city.id,
                nodes:this.goal.nodes.map(node=>node.id),
                unit:this.goal.unit==-1?this.goal.unit:this.goal.unit.id,
                mode:this.goal.mode,
                time:this.goal.time,
                tick:this.goal.tick,
                damaged:this.goal.damaged,
                victor:this.goal.victor
            },
            retreat:this.retreat,
            remove:this.remove,
            fade:this.fade,
            speed:this.speed,
            time:this.time,
            fortified:{
                trigger:this.fortified.trigger,
                city:this.fortified.city==0?-1:this.fortified.city.id
            }
        }
        return composite
    }
    load(composite){
        this.player=composite.player
        this.position=composite.position
        this.id=composite.id
        this.team=composite.team
        this.type=composite.type
        this.value=composite.value
        this.base=composite.base
        this.last=composite.last
        this.goal=composite.goal
        this.retreat=composite.retreat
        this.remove=composite.remove
        this.fade=composite.fade
        this.speed=composite.speed
        this.time=composite.time
        this.fortified=composite.fortified
        this.img=[graphics.load.team[types.team[this.team].loadIndex],graphics.load.unit[this.type]]
    }
    loadBar(){
        this.goal.city=this.goal.city==-1?-1:this.operation.cities[findId(this.goal.city,this.operation.cities)]
        this.goal.nodes=this.goal.nodes.map(node=>this.operation.cities[findId(node,this.operation.cities)])
        this.goal.unit=this.goal.unit==-1?-1:this.operation.units[findId(this.goal.unit,this.operation.units)]
        this.fortified.city=this.fortified.city==-1?0:this.operation.cities[findId(this.fortified.city,this.operation.cities)]
    }
    display(layer,scene){
        switch(scene){
            case `main`:
                if(this.fade.main>0){
                    this.width=this.img[1].width*options.unitSize*0.5
                    this.height=this.img[1].height*options.unitSize*0.5
                    layer.image(this.img[0],this.position.x,this.position.y,(this.width-0.5)*this.fade.main,(this.height-0.5)*this.fade.main)
                    layer.image(this.img[1],this.position.x,this.position.y,this.width*this.fade.main,this.height*this.fade.main)
                }
            break
            case `map`:
                if(this.fade.main>0){
                    layer.image(this.img[0],this.position.x,this.position.y,(this.width-0.5)*this.fade.main*2,(this.height-0.5)*this.fade.main*2)
                    layer.image(this.img[1],this.position.x,this.position.y,this.width*this.fade.main*2,this.height*this.fade.main*2)
                }
            break
        }
    }
    displayInfo(layer,scene){
        switch(scene){
            case `main`:
                if(this.fade.main>0){
                    layer.fill(255,this.fade.main)
                    layer.stroke(0,this.fade.main)
                    layer.strokeWeight(2)
                    layer.textSize(15)
                    layer.text(this.value,this.position.x,this.position.y+[20,26,29,32,35][this.type]*options.unitSize+3)
                }
            break
        }
    }
    update(){
        this.fade.main=smoothAnim(this.fade.main,this.fade.trigger,0,1,15)
    }
    operate(){
        if(!this.player&&this.fade.trigger&&inBoxBox(this,this.operation.units[0])&&!(this.retreat.speed>1&&this.operation.units[0].speed.activiation<=0.5)&&this.operation.units[0].retreat.speed<2.5&&this.team!=this.operation.units[0].team){
            switch(basicCollideBoxBox(this,this.operation.units[0])){
                case 0:
                    this.operation.units[0].position.y=this.position.y+this.height/2+this.operation.units[0].height/2
                break
                case 1:
                    this.operation.units[0].position.y=this.position.y-this.height/2-this.operation.units[0].height/2
                break
                case 2:
                    this.operation.units[0].position.x=this.position.x+this.width/2+this.operation.units[0].width/2
                break
                case 3:
                    this.operation.units[0].position.x=this.position.x-this.width/2-this.operation.units[0].width/2
                break
            }
            this.operation.units[0].last.x=this.operation.units[0].position.x
            this.operation.units[0].last.y=this.operation.units[0].position.y
            if(this.speed.stun<=0){
                this.operation.ui.moveTab(this.type==0?(this.fortified.trigger?3:2):1)
                this.operation.ui.battle.enemy=this
                this.operation.ui.battle.circumstance=this.operation.units[0].speed.activation>0?0:1
                this.operation.halt()
                return
            }
        }
        this.time++
        if(this.fade.main<=0&&!this.fade.trigger&&!this.player){
            this.remove=true
        }
        let distGoal=distPos(this,this.goal)
        if(this.speed.stun>0){
            this.speed.stun--
        }else if(this.retreat.speed>1){
            this.retreat.speed-=(this.player?0.05:0.025)
            this.goal.position.x=this.position.x+lsin(this.retreat.direction)*this.speed.max*this.retreat.speed*10
            this.goal.position.y=this.position.y+lcos(this.retreat.direction)*this.speed.max*this.retreat.speed*10
        }else if(!this.player){
            switch(this.type){
                case 1:
                    if(this.operation.teams[this.team].name==`Royal Army`){
                        switch(this.goal.mode){
                            case 0:
                                if(distPos(this,this.operation.units[0])<(this.operation.teams[this.team].spawn.aggress==2?450:600)&&(this.goal.victor||this.goal.damaged||this.operation.teams[this.team].spawn.aggress>0)){
                                    this.goal.mode=1
                                }
                            break
                            case 1:
                                if(distPos(this,this.operation.units[0])>(this.operation.teams[this.team].spawn.aggress==2?450:600)){
                                    this.goal.mode=0
                                    this.goal.city=-1
                                }
                                switch(this.operation.teams[this.team].spawn.aggress){
                                    case 0: case 1:
                                        if((this.value<=this.operation.units[0].value*0.5&&!this.goal.victor||this.goal.damaged)&&this.operation.teams[this.team].name!=`Free Company`){
                                            this.goal.position.x=this.position.x*2-this.operation.units[0].position.x
                                            this.goal.position.y=this.position.y*2-this.operation.units[0].position.y
                                        }else{
                                            this.goal.position.x=this.operation.units[0].position.x
                                            this.goal.position.y=this.operation.units[0].position.y
                                        }
                                    break
                                    case 2:
                                        this.goal.position.x=this.position.x*2-this.operation.units[0].position.x
                                        this.goal.position.y=this.position.y*2-this.operation.units[0].position.y
                                    break
                                }
                            break
                        }
                    }else{
                        if(this.goal.damaged&&this.time%150==0&&this.operation.teams[this.team].units.length>1&&this.goal.mode!=2){
                            this.goal.unit=this.operation.teams[this.team].units[0]
                            for(let a=1,la=this.operation.teams[this.team].units.length;a<la;a++){
                                if(distPos(this,this.operation.teams[this.team].units[a])<distPos(this,this.goal.unit)&&this.operation.teams[this.team].units[a]!=this||this.goal.unit==this){
                                    this.goal.unit=this.operation.teams[this.team].units[a]
                                }
                            }
                            this.goal.mode=2
                        }
                        switch(this.goal.mode){
                            case 0:
                                if(distPos(this,this.operation.units[0])<450&&this.operation.teams[this.team].spawn.aggress>0){
                                    this.goal.mode=1
                                }
                                if(this.goal.city!=-1&&this.goal.city.fade.trigger&&this.goal.city.fortified.unit==0){
                                    this.goal.position.x=this.goal.city.position.x
                                    this.goal.position.y=this.goal.city.position.y
                                }
                                if(distGoal<=1){
                                    this.goal.time++
                                    if(this.goal.city!=-1&&this.fade.trigger&&this.goal.city.fade.trigger&&this.goal.city.fortified.unit==0&&distPos(this,this.goal.city)<1){
                                        this.fade.trigger=false
                                        this.operation.teams[this.team].unitDestroyed(this)
                                        this.operation.units.push(new unit(this.operation,false,this.goal.city.position.x,this.goal.city.position.y,this.operation.id.unit,this.team,0,this.value))
                                        this.operation.id.unit++
                                        this.operation.teams[this.team].units.push(last(this.operation.units))
                                        if(this.goal.city.fortified.trigger){
                                            last(this.operation.units).fortified.trigger=true
                                        }
                                        last(this.operation.units).fortified.city=this.goal.city
                                        this.goal.city.fortified.unit=last(this.operation.units)
                                    }
                                }
                                if(this.goal.city==-1||this.goal.time>=30){
                                    for(let a=0,la=this.operation.teams[this.team].cores.length;a<la;a++){
                                        if(this.operation.teams[this.team].cores[a].fade.trigger&&this.operation.teams[this.team].cores[a].fortified.unit==0&&distPos(this,this.operation.teams[this.team].cores[a])<600){
                                            this.goal.nodes[this.goal.tick]=this.operation.teams[this.team].cores[a]
                                        }
                                    }
                                    this.goal.time=0
                                    this.goal.city=this.goal.nodes[this.goal.tick]
                                    this.goal.tick=1-this.goal.tick
                                    this.goal.position.x=this.goal.city.position.x
                                    this.goal.position.y=this.goal.city.position.y+(this.goal.city.fortified.unit==0?0:60)
                                }
                            break
                            case 1:
                                if(distPos(this,this.operation.units[0])>600){
                                    this.goal.mode=0
                                    this.goal.city=-1
                                }
                                switch(this.operation.teams[this.team].spawn.aggress){
                                    case 1:
                                        if((this.value<=this.operation.units[0].value*0.5&&!this.goal.victor||this.goal.damaged)&&this.operation.teams[this.team].name!=`Free Company`){
                                            this.goal.position.x=this.position.x*2-this.operation.units[0].position.x
                                            this.goal.position.y=this.position.y*2-this.operation.units[0].position.y
                                        }else{
                                            this.goal.position.x=this.operation.units[0].position.x
                                            this.goal.position.y=this.operation.units[0].position.y
                                        }
                                    break
                                    case 2:
                                        this.goal.position.x=this.position.x*2-this.operation.units[0].position.x
                                        this.goal.position.y=this.position.y*2-this.operation.units[0].position.y
                                    break
                                }
                            break
                            case 2:
                                if(!this.goal.unit.fade.trigger){
                                    this.goal.mode=0
                                }else{
                                    if(distPos(this,this.goal.unit)<1&&this.fade.trigger){
                                        this.fade.trigger=false
                                        this.operation.teams[this.team].unitDestroyed(this)
                                        this.goal.unit.value+=this.value
                                        this.goal.unit.goal.damaged=false
                                    }
                                    this.goal.position.x=this.goal.unit.position.x
                                    this.goal.position.y=this.goal.unit.position.y
                                }
                            break
                        }
                    }
                break
                case 2:
                    switch(this.goal.mode){
                        case 0:
                            if(this.goal.city!=-1){
                                if(distPos(this,this.operation.units[0])<300){
                                    this.goal.mode=1
                                }
                                if(this.goal.city.fortified.unit==0||this.goal.city.fortified.unit.team!=this.operation.units[0].team){
                                    this.goal.city=0
                                }else{
                                    if(distPos(this,this.goal.city)<60){
                                        this.goal.position.x=this.position.x
                                        this.goal.position.y=this.position.y
                                        if(this.time%150==0){
                                            if(floor(random(0,4))==0){
                                                let result=this.operation.ui.instantBattle(this,this.goal.city.fortified.unit,(this.fortified.trigger?3:2))
                                                this.value-=result.casualties[0][0].number
                                                this.goal.city.fortified.unit.value-=result.casualties[1][0].number
                                                if(last(result.winner)==1){
                                                    this.operation.prisoners.lost+=this.goal.city.fortified.unit.value
                                                    this.goal.city.fortified.unit.fade.trigger=false
                                                    this.goal.city.fortified.unit=0
                                                    this.goal.city=-1
                                                }
                                            }else{
                                                this.goal.city.fortified.sieged++
                                                this.goal.city.fortified.siegeActive=true
                                            }
                                        }
                                    }else{
                                        this.goal.position.x=this.goal.city.position.x
                                        this.goal.position.y=this.goal.city.position.y
                                    }
                                }
                            }else{
                                if(distPos(this,this.operation.units[0])<450){
                                    this.goal.mode=1
                                }
                                this.goal.position.x=this.operation.units[0].last.x+this.goal.deviation.x
                                this.goal.position.y=this.operation.units[0].last.y+this.goal.deviation.y
                                let first=true
                                if(this.time%150==0){
                                    for(let a=0,la=this.operation.cities.length;a<la;a++){
                                        if(
                                            this.operation.cities[a].rule==this.team&&this.operation.cities[a].fortified.unit!=0&&this.operation.cities[a].fortified.unit.team==this.operation.units[0].team&&
                                            (distPos(this,this.operation.cities[a])<distPos(this,this.goal)||first&&distPos(this.goal,this.operation.cities[a])<300)&&
                                            !this.operation.teams[this.team].units.some(unit=>unit.type==this.type&&unit.team==this.team&&unit.goal.city==this.operation.cities[a])
                                        ){
                                            this.goal.position.x=this.operation.cities[a].position.x
                                            this.goal.position.y=this.operation.cities[a].position.y
                                            this.goal.city=this.operation.cities[a]
                                            first=false
                                        }
                                    }
                                }
                            }
                        break
                        case 1:
                            if(this.operation.teams[this.team].spawn.aggress==2&&this.value<=this.operation.units[0].value*0.75&&this.operation.teams[this.team].name!=`Free Company`){
                                this.goal.mode=2
                                this.goal.city=this.operation.teams[this.team].cores[0]
                                for(let a=1,la=this.operation.teams[this.team].cores.length;a<la;a++){
                                    if(distPos(this,this.operation.teams[this.team].cores[a])+(this.operation.teams[this.team].cores[a].fortified.trigger?0:600)<distPos(this,this.goal.city)+(this.goal.city.fortified.trigger?0:600)){
                                        this.goal.city=this.operation.teams[this.team].cores[a]
                                    }
                                }
                            }else if(distPos(this,this.operation.units[0])>600){
                                this.goal.mode=0
                                this.goal.city=-1
                            }
                            this.goal.position.x=this.operation.units[0].position.x
                            this.goal.position.y=this.operation.units[0].position.y
                            this.operation.units[0].last.x=this.operation.units[0].position.x
                            this.operation.units[0].last.y=this.operation.units[0].position.y
                        break
                        case 2:
                            if(!(this.goal.city.fortified.unit==0||this.goal.city.fortified.unit.team!=this.operation.units[0].team)&&distPos(this,this.goal.city)<60){
                                this.goal.position.x=this.position.x
                                this.goal.position.y=this.position.y
                                if(this.time%150==0){
                                    if(floor(random(0,4))==0){
                                        let result=this.operation.ui.instantBattle(this,this.goal.city.fortified.unit,(this.fortified.trigger?3:2))
                                        this.value-=result.casualties[0][0].number
                                        this.goal.city.fortified.unit.value-=result.casualties[1][0].number
                                        if(last(result.winner)==1){
                                            this.operation.prisoners.lost+=this.goal.city.fortified.unit.value
                                            this.goal.city.fortified.unit.fade.trigger=false
                                            this.goal.city.fortified.unit=0
                                            this.goal.city=-1
                                        }
                                    }else{
                                        this.goal.city.fortified.sieged++
                                        this.goal.city.fortified.siegeActive=true
                                    }
                                }
                            }else if(this.goal.city.fortified.unit==0&&distPos(this,this.goal.city)<1&&this.fade.trigger){
                                this.fade.trigger=false
                                this.operation.teams[this.team].unitDestroyed(this)
                                this.operation.units.push(new unit(this.operation,false,this.goal.city.position.x,this.goal.city.position.y,this.operation.id.unit,this.team,0,this.value))
                                this.operation.id.unit++
                                this.operation.teams[this.team].units.push(last(this.operation.units))
                                if(this.goal.city.fortified.trigger){
                                    last(this.operation.units).fortified.trigger=true
                                }
                                last(this.operation.units).fortified.city=this.goal.city
                                this.goal.city.fortified.unit=last(this.operation.units)
                            }else if(distPos(this,this.goal.city)<1&&this.fade.trigger){
                                this.fade.trigger=false
                                this.operation.teams[this.team].unitDestroyed(this)
                                this.goal.city.fortified.unit.value+=this.value
                            }else{
                                this.goal.position.x=this.goal.city.position.x
                                this.goal.position.y=this.goal.city.position.y
                            }
                        break
                    }
                break
                case 3:
                    if(this.goal.mode==1){
                        if(distPos(this,this.operation.units[0])>750){
                            this.goal.mode=0
                            this.goal.city=-1
                        }
                        this.goal.position.x=this.operation.units[0].position.x
                        this.goal.position.y=this.operation.units[0].position.y
                    }else{
                        if(distPos(this,this.operation.units[0])<600&&this.operation.teams[this.team].spawn.aggress>0){
                            this.goal.mode=1
                        }
                        if(distGoal<=1){
                            this.goal.time++
                        }
                        if(this.goal.city==-1||this.goal.time>=30){
                            this.goal.time=0
                            if(this.operation.teams[this.team].cities.length>0){
                                this.goal.city=randin(this.operation.teams[this.team].cities)
                            }
                            this.goal.position.x=this.goal.city.position.x
                            this.goal.position.y=this.goal.city.position.y+(this.goal.city.fortified.unit==0?0:60)
                        }
                    }
                break
                case 4:
                    this.goal.position.x=this.operation.units[0].position.x
                    this.goal.position.y=this.operation.units[0].position.y
                    this.speed.max=1.5+this.time/3600
                break
            }
        }
        if(this.speed.max>0&&(!this.player||this.fade.trigger)){
            if(distGoal>1){
                this.speed.activation=smoothAnim(this.speed.activation,true,0,1,5)
                let mult=1
                let pix=round(this.position.x/this.operation.scale)*graphics.load.map[this.operation.map][0].height+round(this.position.y/this.operation.scale)
                if(
                    graphics.load.water[floor(pix/8)][pix%8]==0&&
                    !this.operation.cities.some(cit=>distPos(cit,this)<60)
                ){
                    this.speed.water++
                    this.speed.lastWater=15
                    mult*=min(0.6,0.1+this.speed.water*5/300)
                }else{
                    this.speed.water=0
                    if(this.speed.lastWater>0){
                        this.speed.lastWater--
                    }
                }
                this.position=moveTowardVec(this,this.goal,this.speed.activation*(this.speed.max+this.retreat.speed)*mult)
                if(this.player){
                    this.operation.time.active=true
                }
            }else{
                this.speed.activation=smoothAnim(this.speed.activation,false,0,1,15)
                if(this.player){
                    this.operation.time.active=this.operation.time.pass>0?true:false
                }
            }
        }
        if(this.player){
            this.operation.zoom.goal.position.x=this.position.x
            this.operation.zoom.goal.position.y=this.position.y
            this.speed.max=16-log(this.value)*1.2
        }
    }
}