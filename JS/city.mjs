import {types,options,graphics} from './variables.mjs'
import {smoothAnim,distPos,findId} from './functions.mjs'
export class city{
    constructor(operation,x,y,id,data,fortified){
        this.operation=operation
        this.position={x:x,y:y}
        this.id=id
        this.name=data.name
        this.type=data.type
        this.rule=this.operation.ref.team[data.rule]
        this.owner=this.operation.ref.team[data.rule]
        this.fortified={trigger:fortified,unit:0,sieged:0,siegeActive:false,taken:false}
        this.fade={main:0,trigger:true,map:0}
        this.index=0
        this.remove=false
        this.initialResources()
    }
    save(){
        let composite={
            id:this.id,
            name:this.name,
            type:this.type,
            position:this.position,
            rule:this.rule,
            owner:this.owner,
            fortified:{
                trigger:this.fortified.trigger,
                unit:this.fortified.unit==0?-1:this.fortified.unit.id,
                sieged:this.fortified.sieged,
                siegeActive:this.fortified.siegeActive,
                taken:this.fortified.taken,
            },
            fade:this.fade,
            index:this.index,
            remove:this.remove,
        }
        return composite
    }
    load(composite){
        this.id=composite.id
        this.name=composite.name
        this.type=composite.type
        this.position=composite.position
        this.rule=composite.rule
        this.owner=composite.owner
        this.fortified=composite.fortified
        this.sieged=composite.sieged
        this.fade=composite.fade
        this.index=composite.index
        this.remove=composite.remove
    }
    loadBar(){
        this.fortified.unit=this.fortified.unit==-1?0:this.operation.units[findId(this.fortified.unit,this.operation.units)]
    }
    initialResources(){
        let mult=[
            this.type==4||this.type==6?1.5:this.type==1?0.75:1,
            this.type==4||this.type==6?1.5:this.type==1?0.75:1,
            this.type==4||this.type==6?1.5:this.type==3?2:this.type==1?0.8:1,
            this.type==4||this.type==6?1.5:this.type==3?2:this.type==1?0.8:1,
            this.type==4||this.type==6?1.5:this.type==1?0.6:1,
            this.type==4||this.type==6?1.5:1,
        ]
        this.resources={
            manpower:{amount:floor(random(5*mult[0],9*mult[0]+1))*100,instances:floor(random(4*mult[1],7*mult[1]+1))},
            food:{amount:floor(random(80*mult[2],100*mult[2]+1)),instances:floor(random(5*mult[3],10*mult[3]+1)),tick:0},
            raid:{trigger:false,amount:floor(random(150*mult[4],240*mult[4]+1)),instances:floor(random(3*mult[5],5*mult[5]+1)),tick:0}
        }
        this.resources.manpower.cost=floor(random(0.3*this.resources.manpower.amount,0.5*this.resources.manpower.amount+1))
        this.resources.manpower.base={instances:this.resources.manpower.instances}
        this.resources.food.cost=floor(random(2*this.resources.food.amount,2.5*this.resources.food.amount+1))
        this.resources.food.base={instances:this.resources.food.instances}
        this.resources.raid.base={instances:this.resources.raid.instances}
    }
    setCore(){
        this.operation.teams[this.rule].cities.push(this)
        this.operation.teams[this.rule].cores.push(this)
    }
    taken(){
        if(!this.fortified.taken){
            this.fortified.taken=true
            switch(this.type){
                case 2: case 6:
                    if(this.operation.time.total>0){
                        this.operation.time.total+=1800
                    }
                break
            }
        }
    }
    tick(){
        if(this.fortified.siegeActive){
            this.fortified.siegeActive=false
        }else if(this.fortified.sieged>0){
            this.fortified.sieged-=0.1
        }
        if(!this.resources.raid.trigger){
            if(this.resources.manpower.tick>0){
                this.resources.manpower.tick--
            }else if(this.resources.manpower.instances<this.resources.manpower.base.instances){
                this.resources.manpower.instances++
            }
            if(this.resources.food.tick>0){
                this.resources.food.tick--
            }else if(this.resources.food.instances<this.resources.food.base.instances){
                this.resources.food.instances++
            }
        }
    }
    display(layer,scene){
        switch(scene){
            case `main`:
                if(this.fade.main>0){
                    layer.push()
                    layer.translate(this.position.x,this.position.y)
                    layer.scale(5/options.scale*this.operation.scale)
                    let img=graphics.load.city[types.cityType[this.type].term[0]]
                    layer.image(img,0,0,img.width*0.1*this.fade.main,img.height*0.1*this.fade.main)
                    if(this.fortified.trigger){
                        let img2=graphics.load.city[7]
                        layer.image(img2,0,0,img.width*0.1*this.fade.main,img.height*0.1*this.fade.main)
                    }
                    if(types.cityType[this.type].term[1]!=-1){
                        img=graphics.load.city[types.cityType[this.type].term[1]]
                        layer.image(img,0,0,img.width*0.1*this.fade.main,img.height*0.1*this.fade.main)
                    }
                    layer.fill(255)
                    layer.textSize(img.height*0.02*this.fade.main)
                    layer.text(this.name,0,img.height*0.04*this.fade.main)
                    layer.pop()
                }
            break
            case `map`:
                if(this.fade.map>0){
                    layer.push()
                    layer.translate(this.position.x,this.position.y)
                    layer.scale(5/options.scale*this.operation.scale)
                    let img=graphics.load.city[types.cityType[this.type].term[0]]
                    layer.image(img,0,0,img.width*0.1*this.fade.main,img.height*0.1*this.fade.main)
                    if(this.fortified.trigger){
                        let img2=graphics.load.city[7]
                        layer.image(img2,0,0,img.width*0.1*this.fade.main,img.height*0.1*this.fade.main)
                    }
                    if(types.cityType[this.type].term[1]!=-1){
                        img=graphics.load.city[types.cityType[this.type].term[1]]
                        layer.image(img,0,0,img.width*0.1*this.fade.main,img.height*0.1*this.fade.main)
                    }
                    layer.fill(255)
                    layer.textSize(img.height*0.04*this.fade.main)
                    layer.text(this.name,0,img.height*0.06*this.fade.main)
                    if(this.fortified.unit!=0){
                        img=[graphics.load.team[types.team[this.fortified.unit.team].loadIndex],graphics.load.unit[5]]
                        layer.image(img[0],0,0,img[1].width*0.025*this.fade.main,img[1].height*0.025*this.fade.main)
                        layer.image(img[1],0,0,img[1].width*0.025*this.fade.main,img[1].height*0.025*this.fade.main)
                    }
                    layer.pop()
                }
            break
        }
    }
    update(layer,scene){
        switch(scene){
            case 'main':
                this.fade.main=smoothAnim(this.fade.main,this.fade.trigger,0,1,15)
                if(this.fade.main<=0&&!this.fade.trigger&&!this.player){
                    this.remove=true
                }
            break
        }
    }
    onClick(layer,mouse,scene,rel){
        switch(scene){
            case 'main':
                if(distPos(rel,this)<80&&distPos(this,this.operation.units[0])<80&&this.fade.trigger){
                    this.operation.ui.cityClick(layer,mouse,scene,this,false)
                }
            break
        }
    }
}