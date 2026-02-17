import {types,options} from './variables.mjs'
import {randindex,last,distPos,range,randin,findName,findId} from './functions.mjs'
import {unit} from './unit.mjs'
export class team{
    constructor(operation,type){
        this.operation=operation
        this.type=type
        this.player=type==types.team.length-1
        this.name=types.team[this.type].name
        this.cities=[]
        this.cores=[]
        this.units=[]
        this.spawn={
            activation:0,strength:0,next:{type:0,value:0},aggress:this.name==`Free Company`?1:0,
            types:{garrisonIndex:0,patrol:0,field:0,boss:0},
            base:{
                types:{patrol:0,field:0},
                strength:0
            }
        }
    }
    save(){
        let composite={
            type:this.type,
            player:this.player,
            name:this.name,
            cities:this.cities.map(city=>city.id),
            cores:this.cores.map(core=>core.id),
            units:this.units.map(unit=>unit.id),
            spawn:this.spawn,
        }
        return composite
    }
    load(composite){
        this.type=composite.type
        this.player=composite.player
        this.name=composite.name
        this.cities=composite.cities
        this.cores=composite.cores
        this.units=composite.units
        this.spawn=composite.spawn
    }
    loadBar(){
        this.cities=this.cities.map(city=>this.operation.cities[findId(city,this.operation.cities)])
        this.cores=this.cores.map(core=>this.operation.cities[findId(core,this.operation.cities)])
        this.units=this.units.map(unit=>this.operation.units[findId(unit,this.operation.units)])
    }
    initialPatrols(){
        this.spawn.base.strength=this.cores.reduce((acc,core)=>acc+(core.type==1?0.5:1),0)
        this.spawn.base.types.patrol=round(this.cores.length/2-random(0,1))
        this.spawn.types.patrol=this.spawn.base.types.patrol
        let possible=[]
        let upTick=this.cores.length==1&&types.team[this.type].quality<1?10:0
        this.cores.forEach((core,index)=>{
            possible.push(index)
            this.operation.units.push(new unit(this.operation,false,core.position.x,core.position.y,this.operation.id.unit,this.type,0,round(random(2.5+upTick,10+upTick)*types.cityType[core.type].value*(core.fortified?1.25:1)*(1+this.spawn.base.strength*0.05)*options.difficulty)*100))
            this.operation.id.unit++
            this.units.push(last(this.operation.units))
            if(core.fortified.trigger){
                last(this.operation.units).fortified.trigger=true
            }
            last(this.operation.units).fortified.city=core
            core.fortified.unit=last(this.operation.units)
        })
        for(let a=0,la=this.spawn.base.types.patrol;a<la;a++){
            let cit=[this.cores[possible.splice(randindex(possible),1)],this.cores[possible[0]]]
            let remover=0
            for(let b=1,lb=possible.length;b<lb;b++){
                if(distPos(cit[0],this.cores[possible[b]])<distPos(cit[0],cit[1])){
                    cit[1]=this.cores[possible[b]]
                    remover=b
                }
            }
            possible.splice(remover,1)
            this.operation.units.push(new unit(this.operation,false,cit[0].position.x,cit[0].position.y+60,this.operation.id.unit,this.type,1,round(random(5,20)*(1+this.spawn.base.strength*0.05)*options.difficulty)*100))
            this.operation.id.unit++
            this.units.push(last(this.operation.units))
            last(this.operation.units).goal.nodes=[cit[0],cit[1]]
            last(this.operation.units).goal.tick=0
        }
    }
    unitDestroyed(destroyed){
        this.units=this.units.filter(uni=>uni.id!=destroyed.id)
        switch(destroyed.type){
            case 0:
                this.spawn.base.types.field++
                this.cities=this.cities.filter(cit=>cit.name!=destroyed.fortified.city.name)
                if(this.cities.length==0){
                    this.spawn.aggress=2
                }else if(this.cities.length<=this.cores.length*0.5&&this.spawn.types.boss==0){
                    this.spawn.types.boss=1
                    let possible=[]
                    for(let a=0,la=6;a<la;a++){
                        if(possible.length==0){
                            this.cities.forEach((cit,index)=>{
                                if(a==5||distPos(cit,this.operation.units[0])>[1200,600,300,150,50][a]){
                                    possible.push(index)
                                }
                            })
                        }else{
                            break
                        }
                    }
                    let cit=[this.cities[randin(possible)]]
                    this.operation.units.push(new unit(this.operation,false,cit[0].position.x,cit[0].position.y+60,this.operation.id.unit,this.type,3,round((this.spawn.base.strength*8+random(20,30))*options.difficulty)*100))
                    this.operation.id.unit++
                    this.units.push(last(this.operation.units))
                }
                if(this.spawn.types.garrisonIndex%2==0){
                    this.spawn.base.types.patrol--
                }
                this.spawn.types.garrisonIndex++
            break
            case 1:
                if(this.spawn.base.types.field<=this.spawn.types.field){
                    this.spawn.base.types.field++
                }
                this.spawn.types.patrol--
            break
        }
    }
    cityDestroyed(destroyed){
        this.cities=this.cities.filter(city=>city.id!=destroyed.id)
        this.cores=this.cores.filter(city=>city.id!=destroyed.id)
    }
    tick(){
        if(this.spawn.aggress==1){
            if(this.spawn.next.type==0){
                let possible=[]
                if(this.spawn.types.patrol<this.spawn.base.types.patrol){
                    possible.push(1)
                }
                if(this.spawn.types.field<this.spawn.base.types.field){
                    possible.push(2)
                }
                if(possible.length>0){
                    this.spawn.next.type=randin(possible)
                    switch(this.spawn.next.type){
                        case 1:
                            this.spawn.next.value=round(random(5,20)*(1+this.cities.reduce((acc,city)=>acc+(city.type==1?0.5:1),0)*0.05)*options.difficulty)*100
                        break
                        case 2:
                            this.spawn.next.value=round(random(10,40+random(0,20))*(1+this.cities.reduce((acc,city)=>acc+(city.type==1?0.5:1),0)*0.05)*options.difficulty)*100
                        break
                    }
                }
            }else{
                this.spawn.activation=min(1,this.spawn.activation+0.1)
                let num=this.cities.reduce((acc,city)=>acc+(city.type==1?0.5:1),0)*this.spawn.activation
                this.spawn.strength+=(num-num**2/50)*1000*options.difficulty
                if(this.spawn.strength>=this.spawn.next.value){
                    let success=false
                    let cit
                    let possible
                    switch(this.spawn.next.type){
                        case 1:
                            possible=range(0,this.cities.length).filter(cit=>distPos(this.cities[cit],this.operation.units[0])>300)
                            this.units.forEach(unit=>{
                                if(unit.type==1){
                                    possible=possible.filter(cit=>!unit.goal.nodes.map(node=>node.id).includes(this.cities[cit].id))
                                }
                            })
                            if(possible.length>=2){
                                let cit=[this.cities[possible.splice(randindex(possible),1)],this.cities[possible[0]]]
                                for(let b=1,lb=possible.length;b<lb;b++){
                                    if(distPos(cit[0],this.cities[possible[b]])<distPos(cit[0],cit[1])){
                                        cit[1]=this.cities[possible[b]]
                                    }
                                }
                                this.operation.units.push(new unit(this.operation,false,cit[0].position.x,cit[0].position.y+60,this.operation.id.unit,this.type,1,this.spawn.next.value))
                                this.operation.id.unit++
                                this.units.push(last(this.operation.units))
                                if(distPos(cit[0],this.operation.units[0])<600){
                                    cit=[cit[1],cit[0]]
                                }
                                this.spawn.types.patrol++
                                last(this.operation.units).goal.nodes=[cit[0],cit[1]]
                                last(this.operation.units).goal.tick=0
                                success=true
                            }
                        break
                        case 2:
                            possible=[]
                            this.cities.forEach((cit,index)=>{
                                if(distPos(cit,this.operation.units[0])>600){
                                    for(let a=0,la=cit.type==5?2:1;a<la;a++){
                                        possible.push(index)
                                    }
                                }
                            })
                            if(possible.length>0){
                                cit=[this.cities[randin(possible)]]
                                this.operation.units.push(new unit(this.operation,false,cit[0].position.x,cit[0].position.y+60,this.operation.id.unit,cit[0].type==5?findName(`Free Company`,this.operation.teams):this.type,2,this.spawn.next.value))
                                this.operation.id.unit++
                                this.units.push(last(this.operation.units))
                                this.spawn.types.field++
                                success=true
                            }
                        break
                    }
                    this.spawn.next.type=0
                    if(success){
                        this.spawn.next.value=0
                        this.spawn.strength=0
                    }
                }
            }
        }
    }
    update(layer,scene){
        switch(scene){
            case 'main':
            break
        }
    }
}