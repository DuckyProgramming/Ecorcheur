import {graphics,dev,types,listing,options,constants} from './variables.mjs'
import {findList,findTerm0,distPos,randin,randindex,floor,random,mapVec,dirPos,constrain,last} from './functions.mjs'
import {lsin,lcos} from './graphics.mjs'
import {calc} from './calc.mjs'
import {ui} from './ui.mjs'
import {transitionManager} from './../JS/transitionManager.mjs'
import {city} from './city.mjs'
import {unit} from './unit.mjs'
import {team} from './team.mjs'
export class operation{
    constructor(){
        this.map=0
        this.nextMap=this.map
        this.zoom={
            position:{x:graphics.load.map[this.map][0].width*0.5,y:graphics.load.map[this.map][0].height*0.5},
            goal:{position:{x:graphics.load.map[this.map][0].width*0.5,y:graphics.load.map[this.map][0].height*0.5}},
            map:{x:0,y:0},
            scaling:0,
        }
        this.time={general:0,active:false,total:21600,base:21600,pass:0,final:false,raid:0}
        this.resources={money:1000,food:500}
        this.prisoners={lost:0,gained:0}
        this.edge={x:0,y:0}
        this.id={city:0,unit:0}
        this.cities=[]
        this.units=[]
        this.teams=[]
        this.ref={team:{}}
        this.scale=2.5
        this.scene=`title`
        this.initial()
        this.loadMap(this.map)
        constants.init=true
    }
    save(){
        let composite={
            map:types.map[this.map].term,
            zoom:this.zoom,
            time:this.time,
            resources:this.resources,
            edge:this.edge,
            id:this.id,
            cities:[],
            units:[],
            teams:[],
            ref:this.ref,
            scale:this.scale,
            scene:this.scene,
            ui:this.ui.save(),
            transitionManager:this.transitionManager.save()
        }
        this.cities.forEach(city=>composite.cities.push(city.save()))
        this.units.forEach(unit=>composite.units.push(unit.save()))
        this.teams.forEach(team=>composite.teams.push(team.save()))
        return composite
    }
    saveCol(){
        saveStrings([JSON.stringify(this.save())],'ecorcheurSaveFile','json')
    }
    load(result){
        let composite=JSON.parse(result)

        let map=findTerm0(composite.map,types.map)
        if(map!=this.map){
            this.loadMap(map)
        }
        this.map=map
        this.nextMap=map
        this.zoom=composite.zoom
        this.time=composite.time
        this.resources=composite.resources
        this.edge=composite.edge
        this.id=composite.id
        this.ref=composite.ref
        this.scale=composite.scale
        this.scene=composite.scene
        if(composite.cities!=undefined){
            this.cities=[]
            composite.cities.forEach(cit=>{this.cities.push(new city(this,0,0,{},false));last(this.cities).load(cit)})
        }
        if(composite.units!=undefined){
            this.units=[]
            composite.units.forEach(uni=>{this.units.push(new unit(this,false,0,0,0,0,0,0));last(this.units).load(uni)})
        }
        if(composite.teams!=undefined){
            this.teams=[]
            composite.teams.forEach(tea=>{this.teams.push(new team(this,0));last(this.teams).load(tea)})
        }
        this.cities.forEach(city=>city.loadBar())
        this.units.forEach(unit=>unit.loadBar())
        this.teams.forEach(team=>team.loadBar())
        
        this.ui.load(composite.ui)
        this.ui.loadBar()
        this.transitionManager.load(composite.transitionManager)
    }
    loadStp(input,scene){
        let file=input.files[0]
        let reader=new FileReader()
        reader.operation=this
        reader.scene=scene
        reader.readAsText(file)
        reader.onload=function(){this.operation.load(reader.result);this.operation.scene=scene}
    }
    loadCol(scene){
        let input=document.createElement('input')
        input.type='file'
        input.operation=this
        input.scene=scene
        input.click()
        input.addEventListener('change',function(){this.operation.loadStp(this,this.scene)},false)
    }
    transitionComplete(scene){
        switch(this.scene){
            case `setup`:
                switch(scene){
                    case `main`:
                        this.map=this.nextMap
                        this.loadMap(this.map)
                        this.ui.reset()
                    break
                }
            break
        }
    }
    loadMap(map){
        types.city=types.map[map].city
        types.team=types.map[map].team

        types.cityRef={}
        types.teamRef={}

        types.team.forEach(team=>team.loadIndex=findList(team.term,listing.team))

        this.edge.x=graphics.load.map[this.map][0].width*this.scale,
        this.edge.y=graphics.load.map[this.map][0].height*this.scale

        graphics.load.water=Array.from(graphics.load.water.bytes).map(byte=>byte.toString(2).padStart(8,`0`))
    }
    initial(){
        this.calc=new calc(this)
        this.ui=new ui(this)
        this.transitionManager=new transitionManager(this)
    }
    initialElements(){
        this.teams=[]
        types.team.forEach((tea,index)=>this.teams.push(new team(this,index)))
        this.teams.forEach((team,index)=>this.ref.team[team.name]=index)

        this.cities=[]
        for(let a=0,la=types.city[0].length;a<la;a++){
            this.addCity(types.city[0][a],true)
        }
        let groups=[]
        let leftover=[]
        for(let a=0,la=2;a<la;a++){
            leftover=[]
            groups.push([])
            for(let b=0,lb=types.city[a+1].length;b<lb;b++){
                for(let c=0,lc=groups[a].length+1;c<lc;c++){
                    if(c==lc-1){
                        groups[a].push({cities:[types.city[a+1][b]],rule:types.city[a+1][b].rule})
                    }else if(groups[a][c].rule==types.city[a+1][b].rule){
                        groups[a][c].cities.push(types.city[a+1][b])
                        break
                    }
                }
            }
            for(let b=0,lb=groups[a].length;b<lb;b++){
                if(a==0&&floor(random(0,4))!=0||a==1&&!groups[0].some(group=>group.rule==groups[a][b].rule)){
                    this.addCity(groups[a][b].cities.splice(randindex(groups[a][b].cities),1)[0],true)
                }
                leftover.push(...groups[a][b].cities)
            }
            if(options.allCity){
                leftover.forEach(city=>this.addCity(city,a==1?floor(random(0,2))==0:true))
            }else{
                for(let b=0,lb=60+a*120-this.cities.length;b<lb;b++){
                    this.addCity(leftover.splice(randindex(leftover),1)[0],a==1?floor(random(0,2))==0:true)
                }
            }
        }
    }
    initialComponents(){
        this.cities.forEach(city=>city.setCore())
        this.teams.forEach(team=>team.initialPatrols())

        let cit=[randin(this.cities)]
        cit.push(randin(this.cities.filter(city=>distPos(cit[0],city)<1200&&city!=cit[0])))
        let interp=random(0.2,0.8)
        let loc=mapVec(cit[0].position,cit[1].position,interp)
        while(this.units.some(unit=>distPos(unit,{position:loc})<100)){
            cit=[randin(this.cities)]
            cit.push(randin(this.cities.filter(city=>distPos(cit[0],city)<1200)))
            interp=random(0.2,0.8)
            loc=mapVec(cit[0].position,cit[1].position,interp)
        }
        this.units.splice(0,0,new unit(this,true,loc.x,loc.y,this.id.unit,this.ref.team[`Player`],2,2000))
        this.id.unit++
        this.zoom.position.x=loc.x
        this.zoom.position.y=loc.y
        this.zoom.goal.position.x=loc.x
        this.zoom.goal.position.y=loc.y

        this.units.forEach(unit=>unit.fade.main=1)
    }
    addCity(data,fortified){
        this.cities.push(new city(this,data.loc[0]*this.scale,data.loc[1]*this.scale,this.id.city,data,fortified))
        this.id.city++
    }
    outMap(){
        return types.map[this.map].term
    }
    halt(){
        this.units[0].goal.position.x=this.units[0].position.x
        this.units[0].goal.position.y=this.units[0].position.y
        this.units[0].speed.stun=0
        this.units[0].retreat.speed=1
        this.time.pass=0
    }
    tick(){
        if(this.time.raid){
            this.time.raid=false
        }else if(this.resources.food<=0){
            this.units[0].value-=ceil(this.units[0].value/2000)*100
            if(this.units[0].value<=0){
                this.units[0].fade.trigger=false
            }
        }
        this.resources.food=max(0,this.resources.food-round(this.units[0].value/100))
        this.cities.forEach(city=>city.tick())
        this.teams.forEach(team=>team.tick())
    }
    display(layer){
        switch(this.scene){
            case `title`:
                this.zoom.scaling=max((layer.width-this.ui.width)/this.edge.x,layer.height/this.edge.y)/0.6
                layer.push()
                layer.translate((layer.width-this.ui.width)*0.5,layer.height*0.5)
                layer.scale(this.zoom.scaling)
                layer.translate(-this.edge.x*0.5+800,-this.edge.y*0.5-2700+abs(this.time.general%2400-1200)*4.5)
                layer.image(graphics.load.map[this.map][2],this.edge.x*0.5,this.edge.y*0.5,this.edge.x,this.edge.y)
                layer.pop()
            break
            case `main`:
                if(dev.water){
                    for(let a=0,la=360;a<la;a++){
                        for(let b=0,lb=540;b<lb;b++){
                            let pix=a*10*5400+b*10
                            fill(graphics.load.water[floor(pix/8)][pix%8]*200)
                            rect(a,b,1)
                        }
                    }
                    noLoop()
                }
                layer.push()
                layer.translate((layer.width-this.ui.width)*0.5-this.zoom.position.x,layer.height*0.5-this.zoom.position.y)
                layer.scale(options.scale)
                layer.image(graphics.load.map[this.map][0],this.edge.x*0.5,this.edge.y*0.5,this.edge.x,this.edge.y)
                for(let a=0,la=this.cities.length;a<la;a++){
                    let cit=this.cities[a]
                    if(
                        cit.position.x>this.zoom.position.x-(layer.width-this.ui.width)*0.5/options.scale-100&&
                        cit.position.x<this.zoom.position.x+(layer.width-this.ui.width)*0.5/options.scale+100&&
                        cit.position.y>this.zoom.position.y-layer.height*0.5/options.scale-100&&
                        cit.position.y<this.zoom.position.y+layer.height*0.5/options.scale+100
                    ){
                        cit.display(layer,this.scene)
                        if(
                            cit.fade.map==0&&
                            cit.position.x>this.zoom.position.x-(layer.width-this.ui.width)*0.5/options.scale&&
                            cit.position.x<this.zoom.position.x+(layer.width-this.ui.width)*0.5/options.scale&&
                            cit.position.y>this.zoom.position.y-layer.height*0.5/options.scale&&
                            cit.position.y<this.zoom.position.y+layer.height*0.5/options.scale
                        ){
                            cit.fade.map=1
                        }
                    }
                }
                let display=[]
                for(let a=0,la=this.units.length;a<la;a++){
                    let unit=this.units[a]
                    if(
                        unit.position.x>this.zoom.position.x-(layer.width-this.ui.width)*0.5/options.scale-100&&
                        unit.position.x<this.zoom.position.x+(layer.width-this.ui.width)*0.5/options.scale+100&&
                        unit.position.y>this.zoom.position.y-layer.height*0.5/options.scale-100&&
                        unit.position.y<this.zoom.position.y+layer.height*0.5/options.scale+100
                    ){
                        unit.display(layer,this.scene)
                        display.push(unit)
                    }
                }
                display.forEach(unit=>unit.displayInfo(layer,this.scene))
                layer.pop()
            break
            case `map`:
                this.zoom.scaling=max((layer.width-this.ui.width)/this.edge.x,layer.height/this.edge.y)/0.5
                layer.push()
                layer.translate((layer.width-this.ui.width)*0.5,layer.height*0.5)
                layer.scale(this.zoom.scaling)
                layer.translate(-this.edge.x*0.5-this.zoom.map.x,-this.edge.y*0.5-this.zoom.map.y)
                layer.image(graphics.load.map[this.map][0],this.edge.x*0.5,this.edge.y*0.5,this.edge.x,this.edge.y)
                layer.image(graphics.load.map[this.map][1],this.edge.x*0.5,this.edge.y*0.5,this.edge.x,this.edge.y)
                this.cities.forEach(city=>city.display(layer,this.scene))
                this.units[0].display(layer,this.scene)
                layer.pop()
            break
        }
        this.ui.display(layer,this.scene)
        this.transitionManager.display(layer)
    }
    update(layer){
        this.time.general++
        switch(this.scene){
            case `main`:
                for(let a=0,la=this.cities.length;a<la;a++){
                    this.cities[a].update(layer,this.scene)
                    this.cities[a].index=a
                    if(this.cities[a].remove){
                        this.cities.splice(a,1)
                        a--
                        la--
                    }
                }
                for(let a=0,la=this.units.length;a<la;a++){
                    this.units[a].update(layer,this.scene)
                    if(this.units[a].player||this.time.active){
                        this.units[a].operate(layer,this.scene)
                    }
                    if(this.units[a].remove){
                        this.units.splice(a,1)
                        a--
                        la--
                    }
                }
                this.teams.forEach(team=>{if(team.player||this.time.active){team.update(layer,this.scene)}})
                this.ui.update(layer,this.scene)
                if(this.time.active){
                    this.time.total--
                    if(this.time.total%150==0){
                        this.tick()
                    }
                    if(this.time.total<=0&&!this.time.final){
                        this.time.final=true
                        let possible=[]
                        for(let a=0,la=7;a<la;a++){
                            for(let b=0,lb=this.cities.length;b<lb;b++){
                                if(this.cities[b].type==[4,6,3,2,5,0,1][a]){
                                    possible.push(this.cities[b])
                                }
                            }
                            if(possible.length>0){
                                break
                            }
                        }
                        let cit=randin(possible)
                        let pos={x:0,y:0}
                        if(distPos(cit,this.units[0])>1200){
                            pos=cit.position
                        }else{
                            let dir=dirPos(this.units[0],cit)
                            pos.x=this.units[0].position.x+1200*lsin(dir)
                            pos.y=this.units[0].position.y+1200*lcos(dir)
                        }
                        this.teams[this.ref.team[`Royal Army`]].spawn.aggress=1
                        this.units.push(new unit(this,false,pos.x,pos.y+60,this.id.unit,this.ref.team[`Royal Army`],4,
                            round(this.teams.reduce((acc,team)=>acc+(team.spawn.aggress<2?team.spawn.base.strength:0),0)*6*options.difficulty)*100
                        ))
                        this.id.unit++
                    }
                }
                if(this.time.pass>0){
                    this.time.pass--
                }
                this.zoom.position.x=constrain(this.zoom.position.x*0.8+this.zoom.goal.position.x*0.2,(layer.width-this.ui.width)*0.5,this.edge.x*options.scale+this.ui.width-(layer.width-this.ui.width)*0.5)
                this.zoom.position.y=constrain(this.zoom.position.y*0.8+this.zoom.goal.position.y*0.2,layer.height*0.5,this.edge.y*options.scale-layer.height*0.5)
                this.zoom.goal.position.x=constrain(this.zoom.goal.position.x,(layer.width-this.ui.width)*0.5,this.edge.x*options.scale+this.ui.width-(layer.width-this.ui.width)*0.5)
                this.zoom.goal.position.y=constrain(this.zoom.goal.position.y,layer.height*0.5,this.edge.y*options.scale-layer.height*0.5)
            break
            default:
                this.ui.update(layer,this.scene)
            break
        }
        if(!dev.close){
            this.transitionManager.update()
        }
    }
    onClick(layer,mouse){
        let rel
        switch(this.scene){
            case `map`: case `title`:
                this.ui.onClick(layer,mouse,this.scene)
            break
            case `main`:
                rel={position:{x:(mouse.position.x+this.zoom.position.x-layer.width*0.5+this.ui.width*0.5)/options.scale,y:(mouse.position.y+this.zoom.position.y-layer.height*0.5)/options.scale}}
                this.cities.forEach(city=>city.onClick(layer,mouse,this.scene,rel))
                this.ui.onClick(layer,mouse,this.scene)
            break
        }
        this.zoom.dragging=0
    }
    onDrag(layer,mouse,previous,button){
        switch(this.scene){
            case `map`:
                this.zoom.map.x=constrain(
                    this.zoom.map.x-(mouse.position.x-previous.position.x)*(button==`right`?6:2),
                    -(this.edge.x*0.5-(layer.width-this.ui.width)*0.5/this.zoom.scaling),
                    (this.edge.x*0.5-(layer.width-this.ui.width)*0.5/this.zoom.scaling),
                )
                this.zoom.map.y=constrain(
                    this.zoom.map.y-(mouse.position.y-previous.position.y)*(button==`right`?6:2),
                    -(this.edge.y*0.5-layer.height*0.5/this.zoom.scaling),
                    (this.edge.y*0.5-layer.height*0.5/this.zoom.scaling),
                )
            break
        }
        this.zoom.dragging++
    }
    onKey(layer,key){
        this.ui.onKey(layer,key,this.scene)
    }
}