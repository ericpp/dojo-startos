ARCHES := x86 arm

# overrides to s9pk.mk must precede the include statement
include s9pk.mk

assets: icon.png instructions.md LICENSE.md
	@mkdir -p assets
	@cp icon.png assets/
	@cp instructions.md assets/
	@cp LICENSE.md assets/
