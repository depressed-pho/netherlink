# Changes

## 1.0.1 -- 2022-12-08

* Updated the range of valid block height of the Overworld from [0, 256] to
  [-64, 320] to match Minecraft 1.18. Note that there seems to be a maximum
  Y distance of linkable portals on BE, unlike JE where portals are
  searched only by chunk distances. However, the [Wiki
  page](https://minecraft.fandom.com/wiki/Nether_portal) tells us nothing
  about the difference and we don't know exactly how portals on BE work. So
  for now Netherlink assumes the JE behaviour and can sometimes make
  false-positives on portal connectivity on BE.

## 1.0.0 -- 2020-10-27

* Initial release.
