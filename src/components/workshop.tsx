import {
  ChevronLeft,
  Coins,
  Hammer,
  Magnet,
  MoveHorizontal,
  Scissors,
  Shield,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { GEAR, nextTier, ownedTier, type GearId } from "@/game/gear";
import type { Save } from "@/game/save";
import { Coin, IconButton } from "./bits";

const ICONS: Record<GearId, LucideIcon> = {
  brace: Shield,
  windbreak: Wind,
  cutter: Scissors,
  footing: MoveHorizontal,
  magnet: Magnet,
  temper: Hammer,
  mint: Coins,
};

/** Where coins become devices. Everything bought here stays bought and is always on. */
export function Workshop({
  save,
  onBuy,
  onBack,
}: {
  save: Save;
  onBuy: (id: GearId) => void;
  onBack: () => void;
}) {
  return (
    <div className="screen screen-in" data-ui>
      <div className="flex items-center justify-between">
        <IconButton label="Back" onPress={onBack}>
          <ChevronLeft size={20} strokeWidth={2.2} />
        </IconButton>
        <p className="kicker">Workshop</p>
        <p className="wallet" aria-label={`${save.coins} coins`}>
          <Coin size={15} /> {save.coins}
        </p>
      </div>

      <ol className="levels">
        {GEAR.map((gear) => {
          const Icon = ICONS[gear.id];
          const have = ownedTier(save.gear, gear.id);
          const next = nextTier(save.gear, gear.id);
          const current = have > 0 ? gear.tiers[have - 1]!.effect : "Not built";
          const short = next ? next.cost - save.coins : 0;
          return (
            <li key={gear.id}>
              <div className={"level gear" + (have > 0 ? " gear-built" : "")}>
                <span className="gear-icon">
                  <Icon size={20} strokeWidth={2.1} />
                </span>
                <div className="level-text">
                  <span className="level-name">{gear.name}</span>
                  <span className="level-blurb">{gear.blurb}</span>
                  <span className="gear-now">
                    <span className="gear-pips" aria-label={`Tier ${have} of ${gear.tiers.length}`}>
                      {gear.tiers.map((_, i) => (
                        <span key={i} className={"pip" + (i < have ? " pip-on" : "")} />
                      ))}
                    </span>
                    {current}
                  </span>
                </div>
                {next ? (
                  <button
                    type="button"
                    className="btn gear-buy"
                    disabled={short > 0}
                    aria-label={`Build ${gear.name}: ${next.effect}, ${next.cost} coins`}
                    onClick={() => onBuy(gear.id)}
                  >
                    <span>
                      <Coin size={13} /> {next.cost}
                    </span>
                    <small>{short > 0 ? `${short} short` : next.effect}</small>
                  </button>
                ) : (
                  <span className="gear-max">Built</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
