import {dev,types,options} from './variables.mjs'
import {last,smoothAnim,random,round,inPointBox,boxify,dirPos,mergeColor,nameColor,formatTime} from './functions.mjs'
import {unit} from './unit.mjs'
export class ui{
    constructor(operation){
        this.operation=operation
        this.width=200
        this.tabs={active:0,anim:[],record:[]}
        /*
        tabs:
        0 - neutral
        1 - fight field army
        2 - fight village
        3 - fight fort
        4 - battle results and acceptance
        5 - view city
        6 - view prisoners
        7 - reorganize
        */
        this.select={city:-1,trigger:false,num:0,editNum:false}
        this.battle={player:0,enemy:0,storeEnemy:0,result:0,circumstance:0}
        this.plunder={money:0,prisoners:0}
        /*
        circumstance:
        0 - attacking field army
        1 - defending from field army
        2 - battling unprotected garrison
        3 - storm fort
        */
        this.initial()
    }
    save(){
        let composite={
            tabs:this.tabs,
            select:this.select,
            battle:{
                player:this.battle.player==0?-1:this.battle.player.id,
                enemy:this.battle.enemy==0?-1:this.battle.enemy.id,
                result:this.battle.result,
                circumstance:this.battle.circumstance,
            },
            plunder:this.plunder,
        }
        return composite
    }
    load(composite){
        this.tabs=composite.tabs
        this.select=composite.select
        this.battle=composite.battle
        this.plunder=composite.plunder
    }
    loaBar(){
        this.battle.player=this.battle.player==-1?0:this.operation.units[findId(this.battle.player,this.operation.units)]
        this.battle.enemy=this.battle.enemy==-1?0:this.operation.units[findId(this.battle.enemy,this.operation.units)]
    }
    initial(){
        for(let a=0,la=8;a<la;a++){
            this.tabs.anim.push(0)
        }
    }
    moveTab(tab){
        this.tabs.active=tab
        this.tabs.record.push(tab)
        if(this.tabs.record.length>100){
            delete this.tabs.record[0]
            this.tabs.record.splice(0,1)
        }
        switch(this.tabs.active){
            case 0: case 5: case 6: case 7:
                this.battle.player=0
                this.battle.enemy=0
            break
        }
    }
    accept(){
        this.battle.player.value-=this.battle.result.casualties[0][0].number
        this.battle.enemy.value-=this.battle.result.casualties[1][0].number
        if(this.battle.player.value<=0){
            this.battle.player.fade.trigger=false
        }
        switch(this.battle.circumstance){
            case 0: case 1:
                if(this.battle.enemy.value<=0){
                    this.battle.enemy.fade.trigger=false
                    this.operation.teams[this.battle.enemy.team].unitDestroyed(this.battle.enemy)
                    if(this.battle.enemy.type==3||this.battle.enemy.type==4){
                        this.operation.teams[this.battle.enemy.team].spawn.aggress=2
                    }
                }
                if(last(this.battle.result.winner)==1){
                    if(random(0,1)<=1-this.battle.enemy.value/this.battle.enemy.base.value*(this.battle.enemy.type+1)){
                        this.battle.enemy.fade.trigger=false
                        this.operation.teams[this.battle.enemy.team].unitDestroyed(this.battle.enemy)
                        if(this.battle.enemy.type==3||this.battle.enemy.type==4){
                            this.operation.teams[this.battle.enemy.team].spawn.aggress=2
                        }
                    }else{
                        this.battle.enemy.retreat.speed=3
                        this.battle.enemy.retreat.direction=dirPos(this.battle.player,this.battle.enemy)
                        this.battle.enemy.goal.damaged=true
                        this.battle.enemy.goal.victor=false
                        this.operation.time.pass=15
                    }
                    this.moveTab(0)
                }else{
                    this.battle.enemy.speed.stun=30
                    this.operation.time.pass=60
                    this.battle.enemy.goal.victor=true
                    this.battle.enemy.goal.damaged=false
                    this.battle.player.retreat.speed=3
                    this.battle.player.retreat.direction=dirPos(this.battle.enemy,this.battle.player)
                    this.moveTab(0)
                }
            break
            case 2: case 3:
                if(last(this.battle.result.winner)==1){
                    this.battle.enemy.fade.trigger=false
                    this.battle.enemy.fortified.city.fortified.unit=0
                    this.select.city=this.battle.enemy.fortified.city.index
                    this.operation.cities[this.select.city].taken()
                    this.operation.teams[this.battle.enemy.team].unitDestroyed(this.battle.enemy)
                    this.moveTab(5)
                }else{
                    this.operation.time.pass=30
                    this.moveTab(this.battle.circumstance)
                }
            break
        }
    }
    cityClick(layer,mouse,scene,city){
        switch(scene){
            case `main`:
                if(mouse.position.x<layer.width-this.width){
                    switch(this.tabs.active){
                        case 0:
                            if(city.fortified.unit==0||city.fortified.unit.team==this.operation.ref.team[`Player`]){
                                this.moveTab(5)
                                this.select.city=city.index
                                this.select.trigger=true
                            }
                        break
                    }
                }
            break
        }
    }
    collectUnits(player,enemy){
        this.battle.player=player
        this.battle.enemy=enemy
        this.operation.calc.sides[0].salient=player.retreat.speed>1?(player.speed.lastWater>0?2:1):0
        this.operation.calc.sides[1].salient=enemy.retreat.speed>1?(enemy.speed.lastWater>0?2:1):0
        this.operation.calc.sides[0].force=[{team:player.team,type:0,number:player.value,dist:0}]
        this.operation.calc.sides[1].force=[{team:enemy.team,type:0,number:enemy.value,dist:[this.operation.teams[enemy.team].name==`Royal Army`?0:4,0,2][this.operation.teams[enemy.team].spawn.aggress]}]
        switch(this.battle.circumstance){
            case 0:
                this.operation.calc.sides[1].strategy=1
            break
            case 1:
                this.operation.calc.sides[0].strategy=1
                if(this.battle.enemy.speed.lastWater>0){
                    this.operation.calc.terrain.list.push(1)
                }
            break
            case 2:
                this.operation.calc.sides[1].strategy=1
                this.operation.calc.terrain.list.push(3)
            break
            case 3:
                this.operation.calc.sides[1].strategy=1
                this.operation.calc.sides[1].force[0].dist=constrain(ceil(this.operation.calc.sides[1].force[0].dist+this.battle.enemy.fortified.city.fortified.sieged),0,this.operation.calc.distSet.length-1)
                this.operation.calc.terrain.list.push(2)
            break
        }
        this.battle.result=this.operation.calc.calc()
        this.operation.calc.reset()
        this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/100+random(-0.5,0.5))*100))
        if(this.battle.result.casualties[0][0].number>=this.battle.player.value){
            this.battle.result.winner[this.battle.result.winner.length-1]=2
        }
        if(this.battle.result.casualties[1][0].number>=this.battle.enemy.value){
            this.battle.result.winner[this.battle.result.winner.length-1]=1
        }
        if(last(this.battle.result.winner)==1){
            switch(this.battle.circumstance){
                case 0:
                    this.plunder.money=round(this.battle.result.casualties[1][0].number*random(0.15,0.6))
                    this.plunder.prisoners=round(this.battle.result.casualties[1][0].number/100*random(0.1,0.4))*100
                break
                case 1:
                    this.plunder.money=round(this.battle.result.casualties[1][0].number*random(0.125,0.5))
                    this.plunder.prisoners=round(this.battle.result.casualties[1][0].number/100*random(0.05,0.2))*100
                break
                case 2:
                    this.plunder.money=round(this.battle.result.casualties[1][0].number*random(0.1,0.4))
                    this.plunder.prisoners=round(this.battle.result.casualties[1][0].number/100*random(0.1,0.4))*100+(this.battle.enemy.value-this.battle.result.casualties[1][0].number)
                break
                case 3:
                    this.plunder.money=round(this.battle.result.casualties[1][0].number*random(0.1875,0.75))
                    this.plunder.prisoners=round(this.battle.result.casualties[1][0].number/100*random(0.1,0.4))*100+(this.battle.enemy.value-this.battle.result.casualties[1][0].number)
                break
            }
            this.operation.resources.money+=this.plunder.money
            this.operation.prisoners.gained+=this.plunder.prisoners
        }
    }
    instantBattle(player,enemy,circumstance){
        this.operation.calc.sides[0].force=[{team:player.team,type:0,number:player.value,dist:player.retreat.speed>1?2:0}]
        this.operation.calc.sides[1].force=[{team:enemy.team,type:0,number:enemy.value,dist:enemy.retreat.speed>1?2:0}]
        switch(circumstance){
            case 0:
                this.operation.calc.sides[1].strategy=1
            break
            case 1:
                this.operation.calc.sides[0].strategy=1
            break
            case 2:
                this.operation.calc.sides[1].strategy=1
                this.operation.calc.terrain.list.push(3)
            break
            case 3:
                this.operation.calc.sides[1].strategy=1
                this.operation.calc.sides[1].force[0].dist=constrain(ceil(enemy.fortified.city.fortified.sieged),0,this.operation.calc.distSet.length-1)
                this.operation.calc.terrain.list.push(2)
            break
        }
        let result=this.operation.calc.calc()
        this.operation.calc.reset()
        result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/100+random(-0.5,0.5))*100))
        if(result.casualties[0][0].number>=player.value){
            result.winner[result.winner.length-1]=2
        }
        if(result.casualties[1][0].number>=enemy.value){
            result.winner[result.winner.length-1]=1
        }
        return result
    }
    display(layer,scene){
        layer.noStroke()
        let tick=0
        let count=0
        switch(scene){
            case `title`:
                layer.push()
                layer.translate(layer.width*0.5,0)
                layer.fill(150)
                layer.rect(0,450,300,280,20)
                layer.fill(0)
                layer.textSize(48)
                layer.text(`Écorcheur`,0,375)
                layer.textSize(24)
                layer.text(`DuckyProgramming`,0,420)
                layer.fill(120)
                layer.rect(0,475,240,50,10)
                layer.rect(0,535,240,50,10)
                layer.fill(100)
                layer.rect(0,475,3,50)
                layer.fill(0)
                layer.rect(-95,475,18,2.4)
                layer.rect(95,475,18,2.4)
                layer.rect(95,475,2.4,18)
                layer.textSize(20)
                layer.text(`Difficulty: ${options.difficulty}`,0,475)
                layer.text(`Begin`,0,535)
                layer.textSize(10)
                layer.text(`Enter`,100,520)
                layer.pop()
            break
            case `main`:
                layer.fill(120)
                layer.rect(layer.width-this.width*0.5,layer.height*0.5,this.width,layer.height)
                this.tabs.anim.forEach((anim,index)=>{
                    layer.fill(150)
                    layer.rect(layer.width+this.width*0.5-this.width*anim,layer.height*0.5,this.width,layer.height)
                    if(anim>0){
                        layer.push()
                        layer.translate(layer.width+this.width*0.5-this.width*anim,0)
                        let cit
                        tick=75
                        count=1
                        switch(index){
                            case 0:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Deniers:\n${this.operation.resources.money}`,0,40)
                                layer.text(`Food:\n${this.operation.resources.food} (-${round(this.operation.units[0].value/100)})`,0,100)
                                layer.text(`Time:`,0,145)
                                layer.textSize(16)
                                layer.text(formatTime(max(0,this.operation.time.total)*2.5),0,190)
                                layer.stroke(0)
                                layer.strokeWeight(1)
                                layer.noFill()
                                layer.rect(0,170,160,10,4)
                                if(this.operation.time.total>0){
                                    layer.fill(0)
                                    layer.rect(-80+80*constrain(this.operation.time.total/this.operation.time.base,0,1),170,160*constrain(this.operation.time.total/this.operation.time.base,0,1),10,4)
                                }
                                tick+=125

                                layer.noStroke()
                                for(let a=0,la=3;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text([`Wait`,`Prisoners`,`Map`][a],0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                            break
                            case 1:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text([`Attacking\nEnemy Army`,`Attacked by\nEnemy Army`][this.battle.circumstance],0,40)
                                for(let a=0,la=2;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text([`Battle`,this.battle.storeEnemy.type==4?`No Retreat`:`Retreat`][a],0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                            break
                            case 2:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Enemy\nVillage`,0,40)
                                layer.textSize(18)
                                layer.text(`Deniers: ${this.operation.resources.money}`,0,tick+12.5)
                                tick+=25

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Battle`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++

                                layer.fill(120)
                                layer.rect(0,tick+30,160,50,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Bribe`,0,tick+25)
                                layer.textSize(12)
                                layer.text(this.battle.storeEnemy.fortified.city.fortified.bribe==0?`Declined`:`Costs ${round(this.battle.storeEnemy.fortified.city.fortified.bribe*this.battle.storeEnemy.value)} Deniers`,0,tick+40)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=60
                                count++

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Exit`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++
                            break
                            case 3:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Enemy\nFort`,0,40)
                                layer.textSize(18)
                                layer.text(`Deniers: ${this.operation.resources.money}`,0,tick+12.5)
                                tick+=25
                                for(let a=0,la=2;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text([`Storm`,`Besiege`][a],0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                                layer.fill(120)
                                layer.rect(0,tick+30,160,50,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Bribe`,0,tick+25)
                                layer.textSize(12)
                                layer.text(this.battle.storeEnemy.fortified.city.fortified.bribe==0?`Declined`:`Costs ${round(this.battle.storeEnemy.fortified.city.fortified.bribe*this.battle.storeEnemy.value)} Deniers`,0,tick+40)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=60
                                count++

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Exit`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++
                            break
                            case 4:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Battle Results`,0,40)

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Accept Results`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=50

                                layer.textSize(18)
                                layer.text(`Winner: ${[`Player`,`Opponent`,`Nobody`][last(this.battle.result.winner)-1]}`,0,tick+17.5)
                                tick+=50
                                for(let a=0,la=this.battle.result.casualties.length;a<la;a++){
                                    for(let b=0,lb=this.battle.result.casualties[a].length;b<lb;b++){
                                        let result=this.battle.result.casualties[a][b]
                                        layer.textSize(18)
                                        layer.text(`${types.team[result.team].name}:\n${result.number}`,0,tick+12.5)
                                        tick+=40
                                    }
                                    tick+=10
                                }
                                if(last(this.battle.result.winner)==1){
                                    layer.textSize(18)
                                    layer.text(`Plunder: ${this.plunder.money} Deniers\nCaptured: ${this.plunder.prisoners} Prisoners`,0,tick+12.5)
                                    tick+=50
                                }
                            break
                            case 5:
                                cit=this.operation.cities[this.select.city]
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Selected City:\n${cit.name}`,0,40)
                                layer.textSize(18)
                                layer.text(`Deniers: ${this.operation.resources.money}`,0,80)
                                layer.text(`Food: ${this.operation.resources.food}`,0,100)
                                tick+=40
                                
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Reorganize`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++

                                layer.fill(100)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(120)
                                if(cit.resources.raid.instances>0){
                                    layer.rect(-80+80*cit.resources.raid.instances/cit.resources.raid.base.instances,tick+25,160*cit.resources.raid.instances/cit.resources.raid.base.instances,40,10)
                                }
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Raid ${cit.resources.raid.amount} Deniers`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++
                                if(!cit.resources.raid.trigger){
                                    layer.fill(100)
                                    layer.rect(0,tick+30,160,50,10)
                                    layer.fill(120)
                                    if(cit.resources.manpower.instances>0){
                                        layer.rect(-80+80*cit.resources.manpower.instances/cit.resources.manpower.base.instances,tick+30,160*cit.resources.manpower.instances/cit.resources.manpower.base.instances,50,10)
                                    }
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`Recruit ${cit.resources.manpower.amount} Troops`,0,tick+25)
                                    layer.textSize(12)
                                    layer.text(`Costs ${cit.resources.manpower.cost} Deniers`,0,tick+40)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=60
                                    count++
                                    
                                    layer.fill(100)
                                    layer.rect(0,tick+30,160,50,10)
                                    layer.fill(120)
                                    if(cit.resources.food.instances>0){
                                        layer.rect(-80+80*cit.resources.food.instances/cit.resources.food.base.instances,tick+30,160*cit.resources.food.instances/cit.resources.food.base.instances,50,10)
                                    }
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`Purchase ${cit.resources.food.amount} Food`,0,tick+25)
                                    layer.textSize(12)
                                    layer.text(`Costs ${cit.resources.food.cost} Deniers`,0,tick+40)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=60
                                    count++
                                }
                            break
                            case 6:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Release\nPrisoners`,0,40)

                                layer.textSize(18)
                                layer.text(`Total Held: ${this.operation.prisoners.gained}`,0,tick+12.5)
                                tick+=25
                                layer.text(`Total Lost: ${this.operation.prisoners.lost}`,0,tick+12.5)
                                tick+=25

                                layer.fill(120,this.select.editNum?240:120,120)
                                layer.rect(0,tick+15,160,20,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(this.select.num,0,tick+15)
                                layer.textSize(10)
                                layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+15)
                                tick+=30
                                count++

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Exchange (1x)`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+15)
                                tick+=50
                                count++

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Conscript (0.4x)`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+15)
                                tick+=50
                                count++

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Ransom (0.2x)`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+15)
                                tick+=50
                                count++
                            break
                            case 7:
                                cit=this.operation.cities[this.select.city]
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Reorganize`,0,40)

                                layer.fill(120,this.select.editNum?240:120,120)
                                layer.rect(0,tick+15,160,20,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(this.select.num,0,tick+15)
                                layer.textSize(10)
                                layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+15)
                                tick+=30
                                count++

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Place Garrison`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+15)
                                tick+=50
                                count++
                                if(cit.fortified.unit!=0){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`Remove Garrison`,0,tick+25)
                                    layer.textSize(10)
                                    layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+15)
                                    tick+=50
                                    count++
                                }
                            break
                        }
                        layer.pop()
                    }
                })
            break
            case `map`:
                tick=75
                count=1

                layer.fill(150)
                layer.rect(layer.width+this.width*0.5-this.width,layer.height*0.5,this.width,layer.height)
                layer.push()
                layer.translate(layer.width+this.width*0.5-this.width,0)

                layer.fill(0)
                layer.textSize(24)
                layer.text(`Deniers:\n${this.operation.resources.money}`,0,40)
                layer.text(`Food:\n${this.operation.resources.food} (-${round(this.operation.units[0].value/100)})`,0,100)
                layer.text(`Time:`,0,145)
                layer.textSize(16)
                layer.text(formatTime(max(0,this.operation.time.total)*2.5),0,190)
                layer.stroke(0)
                layer.strokeWeight(1)
                layer.noFill()
                layer.rect(0,170,160,10,4)
                if(this.operation.time.total>0){
                    layer.fill(0)
                    layer.rect(-80+80*constrain(this.operation.time.total/this.operation.time.base,0,1),170,160*constrain(this.operation.time.total/this.operation.time.base,0,1),10,4)
                }
                tick+=125

                layer.noStroke()
                layer.fill(120)
                layer.rect(0,tick+25,160,40,10)
                layer.fill(0)
                layer.textSize(15)
                layer.text(`Exit`,0,tick+25)
                layer.textSize(10)
                layer.text(`Enter`,60,tick+15)
                tick+=50

                layer.fill(120)
                layer.rect(0,tick+25,160,40,10)
                layer.fill(0)
                layer.textSize(15)
                layer.text(`Save`,0,tick+25)
                layer.textSize(10)
                layer.text(count,60,tick+15)
                tick+=50
                count++

                layer.fill(120)
                layer.rect(0,tick+25,160,40,10)
                layer.fill(0)
                layer.textSize(15)
                layer.text(`Load`,0,tick+25)
                layer.textSize(10)
                layer.text(count,60,tick+15)
                tick+=50
                count++

                let height=480
                layer.fill(0)
                layer.textSize(24)
                layer.text(`Royal Army:`,0,tick+20)
                layer.stroke(0)
                layer.strokeWeight(1)
                layer.rect(-20,tick+40+height/2+1,4,height+2,2)
                layer.rect(20,tick+40+height/2+1,4,height+2,2)
                layer.rect(0,tick+40+height+2,44,4,2)
                layer.noStroke()
                let total=this.operation.teams.reduce((acc,team)=>acc+team.spawn.base.strength,0)
                let set=this.operation.teams.filter(team=>team.spawn.aggress!=2&&team.spawn.base.strength>0)
                let collect=this.operation.teams.filter(team=>team.spawn.aggress==2&&team.spawn.base.strength>0).reduce((acc,team)=>acc+team.spawn.base.strength,0)
                for(let a=0,la=set.length;a<la;a++){
                    layer.fill(...mergeColor(nameColor(set[a].name),[255,255,255],0.1))
                    if(a==0){
                        layer.rect(0,tick+40+height*collect/total+2,35,4,2)
                        layer.rect(0,tick+40+height*(set[a].spawn.base.strength*0.5+collect)/total+1,35,height*set[a].spawn.base.strength/total-2)
                    }else{
                        layer.rect(0,tick+40+height*(set[a].spawn.base.strength*0.5+collect)/total,35,height*set[a].spawn.base.strength/total)
                    }
                    layer.fill(0)
                    layer.rect(0,tick+40+height*(set[a].spawn.base.strength+collect)/total-0.5,35,2)
                    collect+=set[a].spawn.base.strength
                }

                layer.pop()
            break
        }
    }
    update(layer,scene){
        switch(scene){
            case `main`:
                if(!dev.close){
                    this.tabs.anim.forEach((anim,index,array)=>{
                        array[index]=smoothAnim(anim,this.tabs.active==index&&this.operation.time.pass<=0,0,1,5)
                    })
                }
            break
            
        }
    }
    onClick(layer,mouse,scene){
        let rel
        let tick
        switch(scene){
            case `title`:
                rel={position:{x:mouse.position.x-layer.width*0.5,y:mouse.position.y}}
                if(inPointBox(rel,boxify(-60,475,120,50))&&options.difficulty>0.2){
                    options.difficulty=round(options.difficulty*10-1)/10
                }
                if(inPointBox(rel,boxify(60,475,120,50))&&options.difficulty<2){
                    options.difficulty=round(options.difficulty*10+1)/10
                }
                if(inPointBox(rel,boxify(0,535,240,50))){
                    this.operation.transitionManager.begin(`main`)
                    this.operation.initialElements()
                    this.operation.initialComponents()
                }
            break
            case `main`:
                rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
                let cit
                tick=75
                if(this.operation.time.pass<=0&&!this.select.trigger){
                    switch(this.tabs.active){
                        case 0:
                            if(mouse.position.x<layer.width-this.width){
                                this.operation.units[0].goal.position.x=constrain(mouse.position.x-layer.width*0.5+this.width*0.5+this.operation.zoom.position.x,0,this.operation.edge.x)
                                this.operation.units[0].goal.position.y=constrain(mouse.position.y-layer.height*0.5+this.operation.zoom.position.y,0,this.operation.edge.y)
                            }
                            tick+=125
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.operation.time.pass=60
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(6)
                                this.select.num=0
                                this.select.editNum=false
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.operation.transitionManager.begin(`map`)
                            }
                            tick+=50
                        break
                        case 1:
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(4)
                                this.collectUnits(this.operation.units[0],this.battle.enemy)
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))&&this.battle.enemy.type!=4){
                                this.battle.enemy.speed.stun=30
                                this.operation.time.pass=60
                                this.operation.units[0].retreat.speed=3
                                this.operation.units[0].retreat.direction=dirPos(this.battle.enemy,this.operation.units[0])
                                this.moveTab(0)
                            }
                            tick+=50
                        break
                        case 2:
                            if(mouse.position.x<layer.width-this.width){
                                this.battle.enemy.speed.stun=30
                                this.moveTab(0)
                            }
                            tick+=25
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(4)
                                this.battle.circumstance=2
                                this.collectUnits(this.operation.units[0],this.battle.enemy)
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))&&this.battle.storeEnemy.fortified.city.fortified.bribe>0&&this.operation.resources.money>=round(this.battle.storeEnemy.fortified.city.fortified.bribe*this.battle.enemy.value)){
                                this.operation.resources.money-=round(this.battle.storeEnemy.fortified.city.fortified.bribe*this.battle.enemy.value)
                                this.battle.enemy.fade.trigger=false
                                this.operation.units.push(new unit(this.operation,false,this.battle.enemy.position.x,this.battle.enemy.position.y,this.operation.id.unit,this.operation.units[0].team,0,this.battle.enemy.value))
                                this.battle.enemy.fortified.city.fortified.unit=last(this.operation.units)
                                last(this.operation.units).fortified.city=this.battle.enemy.fortified.city
                                if(this.battle.enemy.fortified.city.fortified.trigger){
                                    last(this.operation.units).fortified.trigger=true
                                }
                                this.operation.id.unit++
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                                this.select.city=this.battle.enemy.fortified.city.index
                                this.operation.cities[this.select.city].taken()
                                this.operation.teams[this.battle.enemy.team].unitDestroyed(this.battle.enemy)
                                this.moveTab(5)
                            }
                            tick+=60
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.battle.enemy.speed.stun=30
                                this.moveTab(0)
                            }
                            tick+=50
                        break
                        case 3:
                            if(mouse.position.x<layer.width-this.width){
                                this.battle.enemy.speed.stun=30
                                this.moveTab(0)
                            }
                            tick+=25
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(4)
                                this.battle.circumstance=3
                                this.battle.enemy.fortified.city.fortified.sieged+=0.25
                                this.collectUnits(this.operation.units[0],this.battle.enemy)
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.operation.time.pass=60
                                this.battle.enemy.fortified.city.fortified.sieged++
                                this.battle.enemy.fortified.city.fortified.siegeActive=true
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))&&this.battle.storeEnemy.fortified.city.fortified.bribe>0&&this.operation.resources.money>=round(this.battle.storeEnemy.fortified.city.fortified.bribe*this.battle.enemy.value)){
                                this.operation.resources.money-=round(this.battle.storeEnemy.fortified.city.fortified.bribe*this.battle.enemy.value)
                                this.battle.enemy.fade.trigger=false
                                this.operation.units.push(new unit(this.operation,false,this.battle.enemy.position.x,this.battle.enemy.position.y,this.operation.id.unit,this.operation.units[0].team,0,this.battle.enemy.value))
                                this.battle.enemy.fortified.city.fortified.unit=last(this.operation.units)
                                last(this.operation.units).fortified.city=this.battle.enemy.fortified.city
                                if(this.battle.enemy.fortified.city.fortified.trigger){
                                    last(this.operation.units).fortified.trigger=true
                                }
                                this.operation.id.unit++
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                                this.select.city=this.battle.enemy.fortified.city.index
                                this.operation.cities[this.select.city].taken()
                                this.operation.teams[this.battle.enemy.team].unitDestroyed(this.battle.enemy)
                                this.moveTab(5)
                            }
                            tick+=60
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.battle.enemy.speed.stun=30
                                this.moveTab(0)
                            }
                            tick+=50
                        break
                        case 4:
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.accept()
                            }
                            tick+=50
                        break
                        case 5:
                            if(mouse.position.x<layer.width-this.width){
                                this.moveTab(0)
                            }
                            cit=this.operation.cities[this.select.city]
                            tick+=40
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(7)
                                this.select.num=0
                                this.select.editNum=false
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))&&cit.resources.raid.instances>0){
                                cit.resources.raid.instances--
                                this.operation.resources.money+=cit.resources.raid.amount
                                cit.resources.raid.trigger=true
                                this.operation.time.pass=60
                                this.operation.time.raid=true
                                if(cit.resources.raid.instances<=0){
                                    this.moveTab(0)
                                    cit.fade.trigger=false
                                    this.operation.teams[cit.rule].cityDestroyed(cit)
                                    if(cit.fortified.unit!=0){
                                        this.operation.units[0].value+=cit.fortified.unit.value
                                        cit.fortified.unit.fade.trigger=false
                                        cit.fortified.unit=0
                                    }
                                }
                            }
                            tick+=50
                            if(!cit.resources.raid.trigger){
                                if(inPointBox(rel,boxify(0,tick+30,160,50))&&this.operation.resources.money>=cit.resources.manpower.cost&&cit.resources.manpower.instances>0){
                                    cit.resources.manpower.instances--
                                    cit.resources.manpower.tick=floor(random(4,9))
                                    this.operation.resources.money-=cit.resources.manpower.cost
                                    this.operation.units[0].value+=cit.resources.manpower.amount
                                    this.operation.time.pass=15
                                }
                                tick+=60
                                if(inPointBox(rel,boxify(0,tick+30,160,50))&&this.operation.resources.money>=cit.resources.food.cost&&cit.resources.food.instances>0){
                                    cit.resources.food.instances--
                                    cit.resources.food.tick=floor(random(4,9))
                                    this.operation.resources.money-=cit.resources.food.cost
                                    this.operation.resources.food+=cit.resources.food.amount
                                    this.operation.time.pass=15
                                }
                                tick+=60
                            }
                        break
                        case 6:
                            tick+=50
                            if(mouse.position.x<layer.width-this.width){
                                this.moveTab(0)
                            }
                            if(inPointBox(rel,boxify(0,tick+15,160,20))){
                                this.select.editNum=!this.select.editNum
                            }
                            tick+=30
                            if(this.select.num>0&&this.operation.prisoners.gained>0){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))&&this.operation.prisoners.lost>0){
                                    let num=min(min(this.operation.prisoners.gained,this.select.num),this.operation.prisoners.lost)
                                    this.operation.prisoners.gained-=num
                                    this.operation.prisoners.lost-=num
                                    this.operation.units[0].value+=num
                                    this.moveTab(0)
                                }
                                tick+=50
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    let num=min(this.operation.prisoners.gained,this.select.num)
                                    this.operation.prisoners.gained-=num
                                    this.operation.units[0].value+=floor(num/250)*100
                                    this.moveTab(0)
                                }
                                tick+=50
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    let num=min(this.operation.prisoners.gained,this.select.num)
                                    this.operation.prisoners.gained-=num
                                    this.operation.resources.money+=num/5
                                    this.moveTab(0)
                                }
                                tick+=50
                            }
                        break
                        case 7:
                            if(mouse.position.x<layer.width-this.width){
                                this.moveTab(5)
                            }
                            cit=this.operation.cities[this.select.city]
                            if(inPointBox(rel,boxify(0,tick+15,160,20))){
                                this.select.editNum=!this.select.editNum
                            }
                            tick+=30
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                let num=min(this.select.num,this.operation.units[0].value-100)
                                if(cit.fortified.unit!=0){
                                    cit.fortified.unit.value+=num
                                }else{
                                    this.operation.units.push(new unit(this.operation,false,cit.position.x,cit.position.y,this.operation.id.unit,this.operation.units[0].team,0,num))
                                    cit.fortified.unit=last(this.operation.units)
                                    last(this.operation.units).fortified.city=cit
                                    if(cit.fortified.trigger){
                                        last(this.operation.units).fortified.trigger=true
                                    }
                                    this.operation.id.unit++
                                }
                                this.operation.units[0].value-=num
                            }
                            tick+=50
                            if(cit.fortified.unit!=0){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    let num=min(this.select.num,cit.fortified.unit.value)
                                    if(num<cit.fortified.unit.value){
                                        cit.fortified.unit.value-=num
                                    }else{
                                        cit.fortified.unit.fade.trigger=false
                                        cit.fortified.unit=0
                                    }
                                    this.operation.units[0].value+=num
                                }
                                tick+=50
                            }
                        break
                    }
                }
                this.select.trigger=false
            break
            case `map`:
                rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
                tick=200
                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                    this.operation.transitionManager.begin(`main`)
                }
                tick+=50
                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                    this.operation.saveCol()
                }
                tick+=50
                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                    this.operation.loadCol(`map`)
                }
                tick+=50
            break
        }
    }
    onKey(layer,key,scene){
        let count=1
        switch(scene){
            case `title`:
                if(key==`-`&&options.difficulty>0.2){
                    options.difficulty=round(options.difficulty*10-1)/10
                }
                if(key==`+`&&options.difficulty<2){
                    options.difficulty=round(options.difficulty*10+1)/10
                }
                if(key==`Enter`){
                    this.operation.transitionManager.begin(`main`)
                    this.operation.initialElements()
                    this.operation.initialComponents()
                }
            break
            case `main`:
                let cit
                if(this.operation.time.pass<=0&&!this.select.trigger){
                    switch(this.tabs.active){
                        case 0:
                            if(key==count.toString()){
                                this.operation.time.pass=60
                            }
                            count++
                            if(key==count.toString()){
                                this.moveTab(6)
                                this.select.num=0
                                this.select.editNum=false
                            }
                            count++
                            if(key==count.toString()){
                                this.operation.transitionManager.begin(`map`)
                            }
                            count++
                        break
                        case 1:
                            if(key==count.toString()){
                                this.moveTab(4)
                                this.collectUnits(this.operation.units[0],this.battle.enemy)
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                            }
                            count++
                            if(key==count.toString()&&this.battle.enemy.type!=4){
                                this.battle.enemy.speed.stun=30
                                this.operation.time.pass=60
                                this.operation.units[0].retreat.speed=3
                                this.operation.units[0].retreat.direction=dirPos(this.battle.enemy,this.operation.units[0])
                                this.moveTab(0)
                            }
                            count++
                        break
                        case 2:
                            if(key==`Escape`){
                                this.battle.enemy.speed.stun=30
                                this.moveTab(0)
                            }
                            if(key==count.toString()){
                                this.moveTab(4)
                                this.battle.circumstance=2
                                this.collectUnits(this.operation.units[0],this.battle.enemy)
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                            }
                            count++
                            if(key==count.toString()&&this.battle.storeEnemy.fortified.city.fortified.bribe>0&&this.operation.resources.money>=round(this.battle.storeEnemy.fortified.city.fortified.bribe*this.battle.enemy.value)){
                                this.operation.resources.money-=round(this.battle.storeEnemy.fortified.city.fortified.bribe*this.battle.enemy.value)
                                this.battle.enemy.fade.trigger=false
                                this.operation.units.push(new unit(this.operation,false,this.battle.enemy.position.x,this.battle.enemy.position.y,this.operation.id.unit,this.operation.units[0].team,0,this.battle.enemy.value))
                                this.battle.enemy.fortified.city.fortified.unit=last(this.operation.units)
                                last(this.operation.units).fortified.city=this.battle.enemy.fortified.city
                                if(this.battle.enemy.fortified.city.fortified.trigger){
                                    last(this.operation.units).fortified.trigger=true
                                }
                                this.operation.id.unit++
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                                this.select.city=this.battle.enemy.fortified.city.index
                                this.operation.cities[this.select.city].taken()
                                this.operation.teams[this.battle.enemy.team].unitDestroyed(this.battle.enemy)
                                this.moveTab(5)
                            }
                            count++
                            if(key==count.toString()){
                                this.battle.enemy.speed.stun=30
                                this.moveTab(0)
                            }
                            count++
                        break
                        case 3:
                            if(key==`Escape`){
                                this.battle.enemy.speed.stun=30
                                this.moveTab(0)
                            }
                            if(key==count.toString()){
                                this.moveTab(4)
                                this.battle.circumstance=3
                                this.battle.enemy.fortified.city.fortified.sieged+=0.25
                                this.collectUnits(this.operation.units[0],this.battle.enemy)
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                            }
                            count++
                            if(key==count.toString()){
                                this.operation.time.pass=60
                                this.battle.enemy.fortified.city.fortified.sieged++
                                this.battle.enemy.fortified.city.fortified.siegeActive=true
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                            }
                            count++
                            if(key==count.toString()&&this.battle.storeEnemy.fortified.city.fortified.bribe>0&&this.operation.resources.money>=round(this.battle.storeEnemy.fortified.city.fortified.bribe*this.battle.enemy.value)){
                                this.operation.resources.money-=round(this.battle.storeEnemy.fortified.city.fortified.bribe*this.battle.enemy.value)
                                this.battle.enemy.fade.trigger=false
                                this.operation.units.push(new unit(this.operation,false,this.battle.enemy.position.x,this.battle.enemy.position.y,this.operation.id.unit,this.operation.units[0].team,0,this.battle.enemy.value))
                                this.battle.enemy.fortified.city.fortified.unit=last(this.operation.units)
                                last(this.operation.units).fortified.city=this.battle.enemy.fortified.city
                                if(this.battle.enemy.fortified.city.fortified.trigger){
                                    last(this.operation.units).fortified.trigger=true
                                }
                                this.operation.id.unit++
                                if(this.operation.teams[this.battle.enemy.team].spawn.aggress==0&&this.operation.teams[this.battle.enemy.team].name!=`Royal Army`){
                                    this.operation.teams[this.battle.enemy.team].spawn.aggress=1
                                }
                                this.select.city=this.battle.enemy.fortified.city.index
                                this.operation.cities[this.select.city].taken()
                                this.operation.teams[this.battle.enemy.team].unitDestroyed(this.battle.enemy)
                                this.moveTab(5)
                            }
                            count++
                            if(key==count.toString()){
                                this.battle.enemy.speed.stun=30
                                this.moveTab(0)
                            }
                            count++
                        break
                        case 4:
                            if(key==`Enter`){
                                this.accept()
                            }
                        break
                        case 5:
                            if(key==`Escape`){
                                this.moveTab(0)
                            }
                            cit=this.operation.cities[this.select.city]
                            if(key==count.toString()){
                                this.moveTab(7)
                                this.select.num=0
                                this.select.editNum=false
                            }
                            count++
                            if(key==count.toString()&&cit.resources.raid.instances>0){
                                cit.resources.raid.instances--
                                this.operation.resources.money+=cit.resources.raid.amount
                                cit.resources.raid.trigger=true
                                this.operation.time.pass=60
                                this.operation.time.raid=true
                                if(cit.resources.raid.instances<=0){
                                    this.moveTab(0)
                                    cit.fade.trigger=false
                                    this.operation.teams[cit.rule].cityDestroyed(cit)
                                    if(cit.fortified.unit!=0){
                                        this.operation.units[0].value+=cit.fortified.unit.value
                                        cit.fortified.unit.fade.trigger=false
                                        cit.fortified.unit=0
                                    }
                                }
                            }
                            count++
                            if(!cit.resources.raid.trigger){
                                if(key==count.toString()&&this.operation.resources.money>=cit.resources.manpower.cost&&cit.resources.manpower.instances>0){
                                    cit.resources.manpower.instances--
                                    cit.resources.manpower.tick=floor(random(4,9))
                                    this.operation.resources.money-=cit.resources.manpower.cost
                                    this.operation.units[0].value+=cit.resources.manpower.amount
                                    this.operation.time.pass=15
                                }
                                count++
                                if(key==count.toString()&&this.operation.resources.money>=cit.resources.food.cost&&cit.resources.food.instances>0){
                                    cit.resources.food.instances--
                                    cit.resources.food.tick=floor(random(4,9))
                                    this.operation.resources.money-=cit.resources.food.cost
                                    this.operation.resources.food+=cit.resources.food.amount
                                    this.operation.time.pass=15
                                }
                                count++
                            }
                        break
                        case 6:
                            if(this.select.editNum){
                                if(`1234567890`.includes(key)){
                                    this.select.num=min(1000000,this.select.num*10+int(key)*100)
                                }else if(key==`Backspace`){
                                    this.select.num=floor(this.select.num/1000)*100
                                }
                            }
                            if(key==`Escape`){
                                this.moveTab(0)
                            }
                            if(key.toUpperCase()==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                this.select.editNum=!this.select.editNum
                            }
                            count++
                            if(this.select.num>0&&this.operation.prisoners.gained>0){
                                if(key.toUpperCase()==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]&&this.operation.prisoners.lost>0){
                                    let num=min(min(this.operation.prisoners.gained,this.select.num),this.operation.prisoners.lost)
                                    this.operation.prisoners.gained-=num
                                    this.operation.prisoners.lost-=num
                                    this.operation.units[0].value+=num
                                    this.moveTab(0)
                                }
                                count++
                                if(key.toUpperCase()==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                    let num=min(this.operation.prisoners.gained,this.select.num)
                                    this.operation.prisoners.gained-=num
                                    this.operation.units[0].value+=floor(num/250)*100
                                    this.moveTab(0)
                                }
                                count++
                                if(key.toUpperCase()==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                    let num=min(this.operation.prisoners.gained,this.select.num)
                                    this.operation.prisoners.gained-=num
                                    this.operation.resources.money+=num/5
                                    this.moveTab(0)
                                }
                                count++
                            }
                        break
                        case 7:
                            if(this.select.editNum){
                                if(`1234567890`.includes(key)){
                                    this.select.num=min(1000000,this.select.num*10+int(key)*100)
                                }else if(key==`Backspace`){
                                    this.select.num=floor(this.select.num/1000)*100
                                }
                            }
                            if(key==`Escape`){
                                this.moveTab(5)
                            }
                            cit=this.operation.cities[this.select.city]
                            if(key.toUpperCase()==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                this.select.editNum=!this.select.editNum
                            }
                            count++
                            if(key.toUpperCase()==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                let num=min(this.select.num,this.operation.units[0].value-100)
                                if(cit.fortified.unit!=0){
                                    cit.fortified.unit.value+=num
                                }else{
                                    this.operation.units.push(new unit(this.operation,false,cit.position.x,cit.position.y,this.operation.id.unit,this.operation.units[0].team,0,num))
                                    cit.fortified.unit=last(this.operation.units)
                                    last(this.operation.units).fortified.city=cit
                                    if(cit.fortified.trigger){
                                        last(this.operation.units).fortified.trigger=true
                                    }
                                    this.operation.id.unit++
                                }
                                this.operation.units[0].value-=num
                            }
                            count++
                            if(cit.fortified.unit!=0){
                                if(key.toUpperCase()==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                    let num=min(this.select.num,cit.fortified.unit.value)
                                    if(num<cit.fortified.unit.value){
                                        cit.fortified.unit.value-=num
                                    }else{
                                        cit.fortified.unit.fade.trigger=false
                                        cit.fortified.unit=0
                                    }
                                    this.operation.units[0].value+=num
                                }
                                count++
                            }
                        break
                    }
                }
            break
            case `map`:
                if(key==`Enter`){
                    this.operation.transitionManager.begin(`main`)
                }
                if(key==count.toString()){
                    this.operation.saveCol()
                }
                count++
                if(key==count.toString()){
                    this.operation.loadCol(`map`)
                }
                count++
            break
        }
    }
}   