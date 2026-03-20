.PHONY: help release release-msg release-win

help:
	@echo "Targets:"
	@echo "  make release VERSION=1.2.3"
	@echo "  make release-msg VERSION=1.2.3 MESSAGE='Release v1.2.3'"
	@echo "  make release-win VERSION=1.2.3 [MESSAGE='Release v1.2.3']"

release:
	@test -n "$(VERSION)" || (echo "VERSION is required (e.g. make release VERSION=1.2.3)" && exit 1)
	bash scripts/release-tag.sh "$(VERSION)"

release-msg:
	@test -n "$(VERSION)" || (echo "VERSION is required" && exit 1)
	@test -n "$(MESSAGE)" || (echo "MESSAGE is required" && exit 1)
	bash scripts/release-tag.sh "$(VERSION)" "$(MESSAGE)"

release-win:
	@test -n "$(VERSION)" || (echo "VERSION is required" && exit 1)
	powershell -ExecutionPolicy Bypass -File scripts/release-tag.ps1 "$(VERSION)" "$(MESSAGE)"
