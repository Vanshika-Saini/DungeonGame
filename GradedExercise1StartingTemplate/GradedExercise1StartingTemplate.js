/* Game Features:
The game has multiple enemies: Small Sewer Rat 1, Small Sewer Rat 2, Small Sewer Rat 3 and The Dragon.
When the player enters the hallway the enemy is randomized and when the player attacks the enemy,
it is killed and gone from the hallways and then the other enemies are left. The player can look around again and
can again encounter an enemy and can attack again.
*/
const prompts = require('prompts');

const DOORWAY_MESSAGE = "There are doorways leading to:"
const CHOOSE_ACTION = "Choose your action"
const ENEMY_TO_ATTACK = "Which enemy you want to attack?"
const ROOM_TO_GO = "Which room you want to go to?"

class Room {
    constructor(name, description = '') {
        this.name = name;
        this.description = description;
        this.accessibleRooms = [];
        this.enemies = [];
    }

    addEnemies(enemies) {
        this.enemies = this.enemies.concat(enemies);
    }

    addAccessibleRooms(rooms) {
        this.accessibleRooms = this.accessibleRooms.concat(rooms);
    }

}

class Enemy {
    constructor(name, hitPoints, attackDamagePoint, chancesOfAttack, weaponDescription) {
        this.name = name;
        this.hitPoints = hitPoints;
        this.attackDamagePoint = attackDamagePoint;
        this.chancesOfAttack = chancesOfAttack;
        this.weaponDescription = weaponDescription;
    }
    attack(object) {
        console.log(`${this.name} attacks ${object.name} with its ${this.weaponDescription}`);
        const random = Math.ceil(Math.random() * 100);
        if (this.chancesOfAttack >= random) {
            console.log(`${this.name} hits ${object.name} with ${this.attackDamagePoint} points!`);
            return this.attackDamagePoint;
        }
        console.log(`${this.name} attack misses!`);
        return 0;
    }
}

class Player extends Enemy {
    constructor(room, hitPoints, attackDamagePoint, chancesOfAttack) {
        super('Player', hitPoints, attackDamagePoint, chancesOfAttack, 'Sharp sword');
        this.currentRoom = room;
    }
    setCurrentRoom(room) {
        this.currentRoom = room;
    }

    attackByEnemy(enemy) {
        if (enemy.hitPoints > 0) {
            const attackPoints = enemy.attack(this)
            this.hitPoints -= attackPoints;
            this.hitPoints = Math.max(0, this.hitPoints);
            if (attackPoints > 0)
                console.log(`${this.name} is hit and has ${this.hitPoints} hitpoints remaining`);
        }
    }

    lookAround() {
        if (this.currentRoom.description) {
            console.log('-----------------------');
            console.log('You look around');
            console.log(`You are in the ${this.currentRoom.name} and ${this.currentRoom.description}`);
            console.log('');
            console.log(DOORWAY_MESSAGE);
            this.currentRoom.accessibleRooms.forEach(room => console.log(room.name))
            console.log('\n');
            if (this.currentRoom.enemies.length > 0) {
                const enemy = this.currentRoom.enemies[Math.floor(Math.random() * this.currentRoom.enemies.length)]
                console.log(`You see a ${enemy.name}`);
                this.attackByEnemy(enemy);
            }
            console.log('-----------------------');
        }
    }

    attackOnEnemy(enemy) {
        const attackPoints = this.attack(enemy);
        enemy.hitPoints -= attackPoints;
        if (enemy.hitPoints <= 0) {
            this.currentRoom.enemies = this.currentRoom.enemies.filter(enemyObj=>enemyObj !== enemy)
        }
    }

}

const dungeonEntrance = new Room('The dungeon', 'it is a big and damp room with broken statues all around')
const hallway = new Room('Hallway', 'it is a long and dark hallway with dark pools of water on the floor and some fungus growing on the walls')
const chamber = new Room('Chamber', 'it is a small chamber, which is illuminated by a glowing portal of somekind')
const portal = new Room('Glowing portal')

dungeonEntrance.addAccessibleRooms([hallway]);
hallway.addAccessibleRooms([dungeonEntrance, chamber]);
chamber.addAccessibleRooms([hallway, portal]);

const sewerRat1 = new Enemy('Small sewer rat 1', 2, 1, 50, 'Sharp teeths')
const sewerRat2 = new Enemy('Small sewer rat 2', 2, 1, 50, 'Sharp teeths')
const sewerRat3 = new Enemy('Small sewer rat 3', 2, 1, 50, 'Sharp teeths')
hallway.addEnemies(sewerRat1);
hallway.addEnemies(sewerRat2);
hallway.addEnemies(sewerRat3);

const giantDragon = new Enemy('Giant Dragon', 4, 8, 90, 'Sharp claws and fire')
chamber.addEnemies(giantDragon);

const player = new Player(dungeonEntrance, 10, 2, 75)

const getRequestFromPrompt = async (options) => prompts({
    type: 'select',
    name: 'value',
    ...options
});

// Example set of UI options for the user to select
const initialActionChoices = [{
        title: 'Look around',
        value: 'lookAround'
    },
    {
        title: 'Go to Room',
        value: 'goToRoom'
    },
    {
        title: 'Attack',
        value: 'attack'
    },
    {
        title: 'Exit game',
        value: 'exit'
    }
];

let continueGame = true;

async function gameLoop() {
    let message;
    let choices

    const response = await getRequestFromPrompt({
        message: CHOOSE_ACTION,
        choices: initialActionChoices,
    });

    // Deal with the selected value

    switch (response.value) {
        case 'lookAround':
            player.lookAround();
            break;

        case 'goToRoom':
            message = ROOM_TO_GO;
            choices = player.currentRoom.accessibleRooms.map(accessibleRoom => ({
                title: accessibleRoom.name,
                value: accessibleRoom
            }))
            const newRoom = await getRequestFromPrompt({
                message,
                choices,
            })
            player.setCurrentRoom(newRoom.value);
            console.log(`You move to ${newRoom.value.name}`);
            player.lookAround();
            break;

        case 'attack':
            message = ENEMY_TO_ATTACK;
            choices = player.currentRoom.enemies.map(enemy => ({
                title: enemy.name,
                value: enemy
            }))

            if (choices.length) {
                const enemyToAttack = await getRequestFromPrompt({
                    message,
                    choices,
                })
                player.attackOnEnemy(enemyToAttack.value);
            } else {
                console.log('No enemy in the room to attack!');
            }
            break;

        case 'exit':
            continueGame = false;
            break;
    }

    if (player.currentRoom === portal) {
        console.log('Congratulations, you made through the dungeons!');
        continueGame = false;
    }

    if (player.hitPoints <= 0)
        continueGame = false;

    if (continueGame) {
        gameLoop();
        continueGame = continueGame;
    }
}

process.stdout.write('\033c'); // clear screen on windows

console.log('WELCOME TO THE DUNGEONS OF LORD OBJECT ORIENTUS!')
console.log('================================================')
console.log('You walk down the stairs to the dungeons')
gameLoop();