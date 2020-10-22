import * as _ from "lodash";

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

type ScreenMapArray = Array<ScreenCoordinateObject>;

let map: ScreenMapArray = [];

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
        for (const { width, height, pos, id } of map) {
            if (
                pos.x <= mousePos.x &&
                mousePos.x < pos.x + width &&
                pos.y <= mousePos.y &&
                mousePos.y < pos.y + height
            ) {
                return {
                    pos: {
                        x: mousePos.x - pos.x,
                        y: mousePos.y - pos.y,
                    },
                    id: id,
                };
            }
        }
    }
    setActive(id: string): boolean {
        // First, make it true.
        for (let i = 0; i < map.length; i++) {
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
    onScreenEdge(
        { x: mouseX, y: mouseY }: CoordinateObject,
        id: string = "master"
    ): "n" | "e" | "w" | "s" {
        const screen = this.getById(id);
        if (mouseY <= 0) return "n";
        else if (mouseX >= screen.width - 1) return "e";
        else if (mouseX <= 0) return "w";
        else if (mouseY >= screen.height - 1) return "s";
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
    removeById(id: string): ScreenCoordinateObject {
        for (let i = 0; i < map.length; i++) {
            const { id: _id } = map[i];
            if (id == _id) {
                return map.splice(i, 1)[0];
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
    setScreenMap(screenMap: ScreenMapArray): void {
        map = screenMap;
    }
    getScreenMap(): ScreenMapArray {
        return map;
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

export { ScreenMap, ScreenCoordinateObject, CoordinateObject, ScreenMapArray };
