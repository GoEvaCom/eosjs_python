from setuptools import setup

setup(name='eosjs_python',
      version='0.2.3',
      description='Python library to communicate with eosjs in order to sign blockchain transactions.',
      url='https://github.com/EvaCoop/eosjs_python',
      author='Raphael Gaudreault, Jean Robatto',
      author_email='raphael.gaudreault@eva.coop, jean.robatto@eva.coop',
      license='MIT',
      packages=['eosjs_python'],
      install_requires=['Naked'],
      include_package_data=True,
      zip_safe=False)
