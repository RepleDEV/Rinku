import * as _ from "lodash";

type Edge = "n" | "e" | "w" | "s";

interface CoordinateObject {
    x: number;
    y: number;
}

interface ScreenCoordinateObject {
    width?: number;
    height?: number;
    id?: string;
    pos: CoordinateObject;
    active?: boolean;
}

interface ScreenEdgeCoordinateObject { 
    edge: Edge,
    pos?: CoordinateObject,
    id?: string
}

const map: Array<ScreenCoordinateObject> = [];

class ScreenMap {
    /**
     * Screen Map coordinate plane system.
     * @param screenWidth Master screen's width.
     * @param screenHeight Master screen's height.
     */
    constructor(screenWidth: number, screenHeight: number) {
        map.push({
            width: screenWidth,
            height: screenHeight,
            id: "master",
            pos: {
                x: 0,
                y: 0,
            },
            active: true,
        });
    }
    addScreen(
        screenWidth: number,
        screenHeight: number,
        pos: CoordinateObject,
        id: string
    ): boolean {
        if (!ScreenMap.checkScreen(screenWidth, screenHeight, pos)) {
            return false;
        }

        for (const { id: idx } of map) {
            if (idx == id) {
                return false;
            }
        }

        map.push({
            width: screenWidth,
            height: screenHeight,
            id: id,
            pos: pos,
            active: false,
        });

        return true;
    }
    /**
     * Translates mouse position.
     * @param mousePos Mouse Position
     *
     * Returns undefined if mousePos is out of bounds.
     */
    translate(mousePos: CoordinateObject): ScreenCoordinateObject {
        for (const { width, height, pos, id, active } of map) {
            if (
                (pos.x <= mousePos.x && mousePos.x < pos.x + width) &&
                (pos.y <= mousePos.y && mousePos.y < pos.y + height)
            ) {
                return {
                    pos: {
                        x: mousePos.x - pos.x,
                        y: mousePos.y - pos.y
                    },
                    id: id
                }
            }
        }
    }
    calculateEdgeIntersect(pos1: CoordinateObject, pos2: CoordinateObject): ScreenEdgeCoordinateObject {
        if (_.isEqual(pos1, pos2)) {
            return;
        }        
        
        let closestDistanceX: number = Number.MAX_VALUE;
        let closestDistanceY: number = Number.MAX_VALUE;
        let closestDistanceIdX: string;
        let closestDistanceIdY: string;

        for (const { width, height, pos, id } of map) {
            const xEdges = [pos.x, pos.x + width];
            const yEdges = [pos.y, pos.y + height];
            for (const edge of xEdges) {
                const isInRange = _.inRange(edge, pos1.x, pos2.x);
                const distance = Math.abs(edge - pos1.x);
                if (isInRange && distance < closestDistanceX) {
                    closestDistanceX = distance;
                    closestDistanceIdX = id;
                }
            }

            for (const edge of yEdges) {
                const isInRange = _.inRange(edge, pos1.y, pos2.y);
                const distance = Math.abs(edge - pos1.y);
                if (isInRange && distance < closestDistanceY) {
                    closestDistanceY = distance;
                    closestDistanceIdY = id;
                }
            }
        }

        console.log(
            closestDistanceX, closestDistanceIdX,
            closestDistanceY, closestDistanceIdY
        );
        return;
    }
    setActive(id: string): boolean {
        // First, make it true.
        for (let i = 0;i < map.length;i++) {
            const { id: idx, active } = map[i];
            if (active && idx != id) {
                map[i].active = false;
            }
            if (id == idx) {
                if (!active) {
                    map[i].active = true;
                    return true;
                }
            }
        }
        return false;
    }
    getActive(): ScreenCoordinateObject {
        for (const screen of map) {
            const { active } = screen;
            if (active) {
                return screen;
            }
        }
    }
    onScreenEdge({ x: mouseX, y: mouseY }: CoordinateObject): "n" | "e" | "w" | "s" {
        const screen = this.getById("master");
        if (mouseY <= 0) 
            return "n";
        else if (mouseX >= screen.width - 1) 
            return "e";
        else if (mouseX <= 0)
            return "w";
        else if (mouseY >= screen.height - 1)
            return "s";
    }
    getCurrentActiveScreen(): ScreenCoordinateObject {
        for (const screen of map) {
            const { active } = screen;
            if (active) {
                return screen;
            }
        }
    }
    getById(id: string): ScreenCoordinateObject {
        for (const screen of map) {
            const { id: idx } = screen;
            if (idx == id) {
                return screen;
            }
        }
    }
    static checkScreen(
        screenWidth: number,
        screenHeight: number,
        coord: CoordinateObject
    ): boolean {
        const pillars: Array<[number, number]> = [];
        const rows: Array<[number, number]> = [];

        for (let i = 0; i < map.length; i++) {
            const { width, height, pos } = map[0];
            const { x, y } = pos;
            pillars.push([x, x + width]);
            rows.push([y, y + height]);

            const hasOverlap = this.isOverlap(
                coord,
                { x: coord.x + screenWidth, y: coord.y + screenHeight },
                pos,
                { x: x + width, y: y + height }
            );
            if (hasOverlap) {
                return false;
            }
        }

        for (let i = 0; i < map.length; i++) {
            const pillar = pillars[i];
            const row = rows[i];
            if (coord.x + screenWidth == pillar[0] || coord.x == pillar[1]) {
                if (
                    (coord.y >= row[0] && coord.y < row[1]) ||
                    (coord.y + screenHeight <= row[1] &&
                        coord.y + screenHeight > row[0])
                ) {
                    return true;
                } else {
                    return false;
                }
            } else if (
                (coord.x >= pillar[0] && coord.x < pillar[1]) ||
                (coord.x + screenWidth <= pillar[1] &&
                    coord.x + screenWidth > pillar[0])
            ) {
                if (coord.y == row[1] || coord.y + screenHeight == row[0]) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }
    /**
     * Checks if two rectangles are overlapping
     * @param l1 NW Corner of first rectangle
     * @param r1 SE Corner of first rectangle
     * @param l2 NW Corner of 2nd rectangle.
     * @param r2 SE Corner of 2nd rectangle
     */
    static isOverlap(
        l1: CoordinateObject,
        r1: CoordinateObject,
        l2: CoordinateObject,
        r2: CoordinateObject
    ): boolean {
        if (_.isEqual(l1, l2) && _.isEqual(r1, r2)) return true;

        if (l1.x < l2.x) {
            if (r1.x <= l2.x) {
                return false;
            } else {
                if (r1.y >= l2.y || l1.y <= r2.y) {
                    return false;
                } else {
                    return true;
                }
            }
        } else {
            if (l1.x >= r2.x) {
                return false;
            } else {
                if (r1.y >= l2.y || l1.y <= r2.y) {
                    return false;
                } else {
                    return true;
                }
            }
        }
    }
}

export = ScreenMap;
