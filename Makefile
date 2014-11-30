# Get core, functions and extensions from a DIR variable
CLASSES = $(wildcard $(DIR)/*.class.js)
EXTENDS = $(wildcard $(DIR)/*.extend*.js)
MODULES = ${filter-out $(CLASSES) $(EXTENDS), $(wildcard $(DIR)/*.js)}

# Add here files to add at the 'matrix.js' file
SRC_DIR = src

# Flags for uglifyjs 
UGLIFLAGS = -m --lint

# Directory, list and concatenation of modules
MOD_DIR = modules/
MOD_FILES = ${filter-out $(JSM), $(wildcard $(MOD_DIR)/*.js)}
JSM = $(MOD_DIR)/JSM.js

# Minified modules and projects
MIN_DIR = min/
MIN_FILES = ${filter-out $(JSM_MIN), $(wildcard $(MIN_DIR)/*.js)}
JSM_MIN = $(MIN_DIR)/JSM.min.js
SRC_PROJECTS = $(wildcard projects/*.js)

# Directory for HTML documentation
DOC_DIR = doc/html

# Licence header
LIC_HEAD = licence.txt

all: clean Matching Plot JSM projects

Tools: $(TOOLS_FILES)
	$(eval DIR := $(SRC_DIR)/$@)
	$(eval NAME := $(MOD_DIR)/$@.js)
	$(eval NAME_MIN := $(MIN_DIR)/$@.min.js)
	@echo "* Module "$@" creation"; \
	mkdir -p $(MOD_DIR); \
	cat $(CLASSES) $(MODULES) $(EXTENDS) > $(NAME); \

MatrixView: Tools
	$(eval DIR := $(SRC_DIR)/$@)
	$(eval NAME := $(MOD_DIR)/$@.js)
	$(eval NAME_MIN := $(MIN_DIR)/$@.min.js)
	@echo "* Module "$@" creation"; \
	mkdir -p $(MOD_DIR); \
	cat $(CLASSES) $(MODULES) $(EXTENDS) > $(NAME); \

Matrix: MatrixView Tools
	$(eval DIR := $(SRC_DIR)/$@)
	$(eval NAME := $(MOD_DIR)/$@.js)
	$(eval NAME_MIN := $(MIN_DIR)/$@.min.js)
	@echo "* Module "$@" creation"; \
	mkdir -p $(MOD_DIR); \
	cat $(CLASSES) $(MODULES) $(EXTENDS) > $(NAME); \

Matching: Matrix
	$(eval DIR := $(SRC_DIR)/$@)
	$(eval NAME := $(MOD_DIR)/$@.js)
	$(eval NAME_MIN := $(MIN_DIR)/$@.min.js)
	@echo "* Module "$@" creation"; \
	mkdir -p $(MOD_DIR); \
	cat $(CLASSES) $(MODULES) $(EXTENDS) > $(NAME); \

Plot: 
	$(eval DIR := $(SRC_DIR)/$@)
	$(eval NAME := $(MOD_DIR)/$@.js)
	$(eval NAME_MIN := $(MIN_DIR)/$@.min.js)
	@echo "* Module "$@" creation"; \
	mkdir -p $(MOD_DIR); \
	cat $(CLASSES) $(MODULES) $(EXTENDS) > $(NAME); \

# Node export
JSM: Matrix 
	@echo "* Concatenate ALL the minified JS code"; \
	mkdir -p $(MOD_DIR); \
	cat $(MOD_DIR)/Tools.js $(MOD_DIR)/MatrixView.js $(MOD_DIR)/Matrix.js > $(JSM); \


# Minify modules
minify: $(wildcard $(MOD_DIR)/*.js)
	@mkdir -p $(MIN_DIR); \
	for i in $?; do \
		echo "* Minify module "`basename $$i`; \
		min=`basename $$i .js`; \
		name=$(MIN_DIR)/$${min}.min.js; \
		cat $(LIC_HEAD) > $$name; \
		uglifyjs $$i $(UGLIFLAGS) >> $$name; \
	done;

# Minify projects file
projects: $(SRC_PROJECTS) 
	@echo "* Minify projects";
	@mkdir -p $(MIN_DIR); \
	for i in $(SRC_PROJECTS); do \
		min=`basename $$i .js`; \
		name=$(MIN_DIR)/$${min}.min.js; \
		cat $(LIC_HEAD) > $$name; \
		uglifyjs $$i $(UGLIFLAGS) >> $$name; \
	done;

# Compile the documentation
doc:
	@echo "* Create the documentation";
	@cd doc; jsduck; cd .. \

# Execute jshint on the files 
lint: 	
	@echo "* Lint all the js files";
	for i in $(SRC); do \
		jshint $$i -c; \
	done; \
	for i in $(SRC_PROJECTS); do \
		jshint $$i -c; \
	done;

clean:
	@echo "* Cleaning ";
	@rm -rf $(MIN_DIR)/*.js $(MOD_DIR)/*.js $(DOC_DIR)/*;

.PHONY: clean projects doc
