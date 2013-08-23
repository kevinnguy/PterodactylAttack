#!/usr/bin/env python

import sys
import os
import fnmatch
import re

def quote(s):
	return "'%s'" % s

colors = {
	"baby": {
		"dark": "rgba(60,125,117,1.000)",
		"light": "rgba(128,193,185,1.000)",
	},
	"adult": {
		"dark": "rgba(183,58,52,1.000)",
		"light": "rgba(206,52,52,1.000)",
	},
	"baby_white": {
		"dark": '#ffffff',
		"light": '#ffffff',
	},
	"baby_mountain_blue": {
		"dark": '#2A6598',
		"light": '#7EBBED',
	},
	"baby_mountain_purple": {
		"dark": '#6E179E',
		"light": '#BF56F6',
	},
	"baby_ice_purple": {
		"dark": '#6D1AA8',
		"light": '#BF6EFD',
	},
	"baby_ice_yellow": {
		"dark": '#8C6B12',
		"light": '#E8C358',
	},
	"baby_volcano_green": {
		"dark": '#1A8037',
		"light": '#60DD84',
	},
	"baby_volcano_purple": {
		"dark": '#403277',
		"light": '#9887DB',
	},
	"adult_white": {
		"dark": '#ffffff',
		"light": '#ffffff',
	},
	"adult_mountain_red": {
		"dark": '#892427',
		"light": '#B12432',
	},
	"adult_mountain_green": {
		"dark": '#24894B',
		"light": '#24B151',
	},
	"adult_ice_red": {
		"dark": '#A52E51',
		"light": '#D13169',
	},
	"adult_ice_green": {
		"dark": '#2D8C6F',
		"light": '#2FB582',
	},
	"adult_volcano_blue": {
		"dark": '#137992',
		"light": '#1AA4BB',
	},
	"adult_volcano_orange": {
		"dark": '#BC660E',
		"light": '#DC6A0B',
	},
}

def main():

	print "// auto-generated by '%s'" % os.path.basename(__file__)

	# parse backgrounds
	print "Ptero.vectorPathData = {"
	for root, dirnames, filenames in os.walk('bg'):
		for filename in fnmatch.filter(filenames, '*.svg.js'):

			keyname = 'bg_' + os.path.basename(root) + '_' + filename[:filename.index('.')]

			with open(os.path.join(root,filename)) as f:
				for line in f:
					if line.startswith('(function'):
						print '"%s": %s' % (keyname, line),
					elif line.startswith('})()'):
						print '})(),'
					else:
						print line,
	print "};"

	# create dynamic ptero functions
	for root, dirnames, filenames in os.walk('swf/pteros'):
		for filename in fnmatch.filter(filenames, '*.svg.js'):

			ptero = os.path.basename(root)
			if not ptero in ('baby','adult'):
				continue

			keyname = ptero + '_' + filename[:filename.index('.')]

			c = colors[ptero]
			dark_color = quote(c['dark'])
			light_color = quote(c['light'])

			with open(os.path.join(root,filename)) as f:
				for line in f:
					if line.startswith('(function'):
						print "function make_%s(darkColor, lightColor) {" % keyname
					elif line.startswith('})()'):
						print "}"
					else:
						s = line.replace(dark_color, 'darkColor').replace(light_color, 'lightColor')
						print s,

	# use dynamic ptero functions to generate all the colors
	for root, dirnames, filenames in os.walk('swf/pteros'):
		for filename in fnmatch.filter(filenames, '*.svg.js'):

			ptero = os.path.basename(root)
			index = filename[:filename.index('.')]

			c = colors[ptero]

			keyname = ptero + '_' + index

			if ptero.startswith('baby'):
				rootname = 'baby'
			elif ptero.startswith('adult'):
				rootname = 'adult'
			else:
				raise Exception('no valid rootname for '+ptero)

			print 'Ptero.vectorPathData["%s"] = make_%s_%s("%s","%s");' % (keyname, rootname, index, c['dark'], c['light'])
	

if __name__ == "__main__":
	main()
